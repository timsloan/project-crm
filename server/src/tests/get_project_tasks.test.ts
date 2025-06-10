
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, teamsTable, projectsTable, tasksTable } from '../db/schema';
import { type GetProjectTasksInput } from '../schema';
import { getProjectTasks } from '../handlers/get_project_tasks';

describe('getProjectTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get tasks for a project', async () => {
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
        description: 'A team for testing'
      })
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

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        status: 'planning',
        estimated_value: '10000.00',
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create test tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          status: 'todo',
          priority: 'high',
          project_id: project[0].id,
          assigned_to: user[0].id,
          created_by: user[0].id
        },
        {
          title: 'Task 2',
          description: 'Second task',
          status: 'in_progress',
          priority: 'medium',
          project_id: project[0].id,
          created_by: user[0].id
        }
      ])
      .execute();

    const input: GetProjectTasksInput = {
      project_id: project[0].id
    };

    const result = await getProjectTasks(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Task 1');
    expect(result[0].description).toBe('First task');
    expect(result[0].status).toBe('todo');
    expect(result[0].priority).toBe('high');
    expect(result[0].project_id).toBe(project[0].id);
    expect(result[0].assigned_to).toBe(user[0].id);
    expect(result[0].created_by).toBe(user[0].id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toBe('Task 2');
    expect(result[1].description).toBe('Second task');
    expect(result[1].status).toBe('in_progress');
    expect(result[1].priority).toBe('medium');
    expect(result[1].project_id).toBe(project[0].id);
    expect(result[1].assigned_to).toBeNull();
    expect(result[1].created_by).toBe(user[0].id);
  });

  it('should return empty array for project with no tasks', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: null
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: 'A project with no tasks',
        status: 'planning',
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const input: GetProjectTasksInput = {
      project_id: project[0].id
    };

    const result = await getProjectTasks(input);

    expect(result).toHaveLength(0);
  });

  it('should only return tasks for the specified project', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: null
      })
      .returning()
      .execute();

    // Create two projects
    const project1 = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First project',
        status: 'planning',
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const project2 = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second project',
        status: 'planning',
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create tasks for both projects
    await db.insert(tasksTable)
      .values([
        {
          title: 'Project 1 Task',
          description: 'Task for project 1',
          status: 'todo',
          priority: 'medium',
          project_id: project1[0].id,
          created_by: user[0].id
        },
        {
          title: 'Project 2 Task',
          description: 'Task for project 2',
          status: 'todo',
          priority: 'medium',
          project_id: project2[0].id,
          created_by: user[0].id
        }
      ])
      .execute();

    const input: GetProjectTasksInput = {
      project_id: project1[0].id
    };

    const result = await getProjectTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Project 1 Task');
    expect(result[0].project_id).toBe(project1[0].id);
  });
});
