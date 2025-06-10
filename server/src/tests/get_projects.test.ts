
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, teamsTable, projectsTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();
    expect(result).toEqual([]);
  });

  it('should return all projects', async () => {
    // Create prerequisite data
    const team = await db.insert(teamsTable)
      .values({ name: 'Development Team' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: team[0].id
      })
      .returning()
      .execute();

    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create test projects
    await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          description: 'First project',
          status: 'planning',
          estimated_value: '10000.50',
          company_id: company[0].id,
          created_by: user[0].id
        },
        {
          name: 'Project 2',
          description: 'Second project',
          status: 'active',
          estimated_value: '25000.75',
          company_id: company[0].id,
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(2);
    
    // Verify first project
    const project1 = result.find(p => p.name === 'Project 1');
    expect(project1).toBeDefined();
    expect(project1!.description).toEqual('First project');
    expect(project1!.status).toEqual('planning');
    expect(project1!.estimated_value).toEqual(10000.50);
    expect(typeof project1!.estimated_value).toBe('number');
    expect(project1!.company_id).toEqual(company[0].id);
    expect(project1!.created_by).toEqual(user[0].id);
    expect(project1!.created_at).toBeInstanceOf(Date);
    expect(project1!.updated_at).toBeInstanceOf(Date);

    // Verify second project
    const project2 = result.find(p => p.name === 'Project 2');
    expect(project2).toBeDefined();
    expect(project2!.description).toEqual('Second project');
    expect(project2!.status).toEqual('active');
    expect(project2!.estimated_value).toEqual(25000.75);
    expect(typeof project2!.estimated_value).toBe('number');
  });

  it('should handle projects with null estimated_value', async () => {
    // Create prerequisite data
    const team = await db.insert(teamsTable)
      .values({ name: 'Development Team' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: team[0].id
      })
      .returning()
      .execute();

    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create project without estimated value
    await db.insert(projectsTable)
      .values({
        name: 'Project No Value',
        description: 'Project without estimated value',
        status: 'planning',
        estimated_value: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Project No Value');
    expect(result[0].estimated_value).toBeNull();
  });

  it('should handle projects with all statuses', async () => {
    // Create prerequisite data
    const team = await db.insert(teamsTable)
      .values({ name: 'Development Team' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: team[0].id
      })
      .returning()
      .execute();

    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create projects with different statuses
    const statuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
    for (const status of statuses) {
      await db.insert(projectsTable)
        .values({
          name: `Project ${status}`,
          status: status,
          company_id: company[0].id,
          created_by: user[0].id
        })
        .execute();
    }

    const result = await getProjects();

    expect(result).toHaveLength(5);
    
    // Verify all statuses are present
    const resultStatuses = result.map(p => p.status).sort();
    expect(resultStatuses).toEqual(['active', 'cancelled', 'completed', 'on_hold', 'planning']);
  });
});
