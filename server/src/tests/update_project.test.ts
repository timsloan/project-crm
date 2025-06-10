
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, teamsTable, projectsTable } from '../db/schema';
import { type UpdateProjectInput } from '../schema';
import { updateProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

describe('updateProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let userId: number;
  let teamId: number;
  let projectId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://testcompany.com'
      })
      .returning()
      .execute();
    companyId = company[0].id;

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();
    teamId = team[0].id;

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: teamId
      })
      .returning()
      .execute();
    userId = user[0].id;

    // Create initial project
    const project = await db.insert(projectsTable)
      .values({
        name: 'Initial Project',
        description: 'Initial description',
        status: 'planning',
        estimated_value: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-06-01'),
        company_id: companyId,
        created_by: userId
      })
      .returning()
      .execute();
    projectId = project[0].id;
  });

  it('should update project name', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      name: 'Updated Project Name'
    };

    const result = await updateProject(updateInput);

    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Updated Project Name');
    expect(result.description).toEqual('Initial description'); // Unchanged
    expect(result.status).toEqual('planning'); // Unchanged
    expect(typeof result.estimated_value).toBe('number');
    expect(result.estimated_value).toEqual(1000);
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      name: 'Multi-field Update',
      description: 'Updated description',
      status: 'active',
      estimated_value: 2500.50
    };

    const result = await updateProject(updateInput);

    expect(result.name).toEqual('Multi-field Update');
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('active');
    expect(result.estimated_value).toEqual(2500.50);
    expect(typeof result.estimated_value).toBe('number');
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      description: null,
      estimated_value: null,
      start_date: null,
      end_date: null
    };

    const result = await updateProject(updateInput);

    expect(result.description).toBeNull();
    expect(result.estimated_value).toBeNull();
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
  });

  it('should update date fields correctly', async () => {
    const newStartDate = new Date('2024-03-01');
    const newEndDate = new Date('2024-12-31');

    const updateInput: UpdateProjectInput = {
      id: projectId,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateProject(updateInput);

    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.start_date?.getTime()).toEqual(newStartDate.getTime());
    expect(result.end_date?.getTime()).toEqual(newEndDate.getTime());
  });

  it('should save updated project to database', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      name: 'Database Update Test',
      status: 'completed'
    };

    await updateProject(updateInput);

    // Verify changes were persisted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Database Update Test');
    expect(projects[0].status).toEqual('completed');
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();
    const originalUpdatedAt = originalProject[0].updated_at;

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProjectInput = {
      id: projectId,
      name: 'Timestamp Test'
    };

    const result = await updateProject(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent project', async () => {
    const updateInput: UpdateProjectInput = {
      id: 99999,
      name: 'Non-existent Project'
    };

    await expect(updateProject(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      status: 'on_hold'
    };

    const result = await updateProject(updateInput);

    // Only status should change
    expect(result.status).toEqual('on_hold');
    expect(result.name).toEqual('Initial Project'); // Unchanged
    expect(result.description).toEqual('Initial description'); // Unchanged
    expect(result.estimated_value).toEqual(1000); // Unchanged
  });
});
