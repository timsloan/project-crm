
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, teamsTable, projectsTable } from '../db/schema';
import { type GetProjectInput } from '../schema';
import { getProject } from '../handlers/get_project';

describe('getProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a project by id', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A test team'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: team[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: '50000.75',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const input: GetProjectInput = {
      id: project[0].id
    };

    const result = await getProject(input);

    expect(result.id).toEqual(project[0].id);
    expect(result.name).toEqual('Test Project');
    expect(result.description).toEqual('A test project');
    expect(result.status).toEqual('planning');
    expect(result.estimated_value).toEqual(50000.75);
    expect(typeof result.estimated_value).toEqual('number');
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.company_id).toEqual(company[0].id);
    expect(result.created_by).toEqual(user[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle project with null estimated_value', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: null,
        website: null
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        team_id: null
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Simple Project',
        description: null,
        status: 'active',
        estimated_value: null,
        start_date: null,
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const input: GetProjectInput = {
      id: project[0].id
    };

    const result = await getProject(input);

    expect(result.id).toEqual(project[0].id);
    expect(result.name).toEqual('Simple Project');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('active');
    expect(result.estimated_value).toBeNull();
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.company_id).toEqual(company[0].id);
    expect(result.created_by).toEqual(user[0].id);
  });

  it('should throw error when project does not exist', async () => {
    const input: GetProjectInput = {
      id: 999
    };

    await expect(getProject(input)).rejects.toThrow(/Project with id 999 not found/i);
  });
});
