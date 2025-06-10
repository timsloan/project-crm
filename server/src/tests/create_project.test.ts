
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, companiesTable, usersTable, teamsTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let userId: number;

  beforeEach(async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://testcompany.com'
      })
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create prerequisite team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Development Team',
        description: 'Software development team'
      })
      .returning()
      .execute();
    const teamId = teamResult[0].id;

    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: teamId
      })
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  it('should create a project with all fields', async () => {
    const testInput: CreateProjectInput = {
      name: 'Test Project',
      description: 'A project for testing',
      status: 'active',
      estimated_value: 50000.75,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      company_id: companyId,
      created_by: userId
    };

    const result = await createProject(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Project');
    expect(result.description).toEqual('A project for testing');
    expect(result.status).toEqual('active');
    expect(result.estimated_value).toEqual(50000.75);
    expect(typeof result.estimated_value).toBe('number');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
    expect(result.company_id).toEqual(companyId);
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a project with default status', async () => {
    const testInput: CreateProjectInput = {
      name: 'Planning Project',
      description: null,
      status: 'planning',
      estimated_value: null,
      start_date: null,
      end_date: null,
      company_id: companyId,
      created_by: userId
    };

    const result = await createProject(testInput);

    expect(result.name).toEqual('Planning Project');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('planning'); // Zod default
    expect(result.estimated_value).toBeNull();
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.company_id).toEqual(companyId);
    expect(result.created_by).toEqual(userId);
  });

  it('should save project to database', async () => {
    const testInput: CreateProjectInput = {
      name: 'Database Test Project',
      description: 'Testing database persistence',
      status: 'active',
      estimated_value: 25000.50,
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-11-30'),
      company_id: companyId,
      created_by: userId
    };

    const result = await createProject(testInput);

    // Query using proper drizzle syntax
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    const savedProject = projects[0];
    expect(savedProject.name).toEqual('Database Test Project');
    expect(savedProject.description).toEqual('Testing database persistence');
    expect(savedProject.status).toEqual('active');
    expect(parseFloat(savedProject.estimated_value!)).toEqual(25000.50);
    expect(savedProject.start_date).toEqual(new Date('2024-06-01'));
    expect(savedProject.end_date).toEqual(new Date('2024-11-30'));
    expect(savedProject.company_id).toEqual(companyId);
    expect(savedProject.created_by).toEqual(userId);
    expect(savedProject.created_at).toBeInstanceOf(Date);
    expect(savedProject.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null estimated_value correctly', async () => {
    const testInput: CreateProjectInput = {
      name: 'No Budget Project',
      description: 'Project without estimated value',
      status: 'planning',
      estimated_value: null,
      start_date: null,
      end_date: null,
      company_id: companyId,
      created_by: userId
    };

    const result = await createProject(testInput);

    expect(result.estimated_value).toBeNull();
    
    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].estimated_value).toBeNull();
  });
});
