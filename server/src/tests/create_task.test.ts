
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, companiesTable, usersTable, projectsTable, teamsTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProjectId: number;
  let testAssigneeId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const users = await db.insert(usersTable)
      .values([
        {
          email: 'creator@test.com',
          first_name: 'Task',
          last_name: 'Creator',
          team_id: team[0].id
        },
        {
          email: 'assignee@test.com',
          first_name: 'Task',
          last_name: 'Assignee',
          team_id: team[0].id
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    testAssigneeId = users[1].id;

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        status: 'planning',
        estimated_value: '10000.00',
        start_date: new Date(),
        end_date: null,
        company_id: company[0].id,
        created_by: testUserId
      })
      .returning()
      .execute();

    testProjectId = project[0].id;
  });

  it('should create a task with defaults', async () => {
    const testInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A task for testing',
      status: 'todo',
      priority: 'medium',
      due_date: new Date('2024-12-31'),
      project_id: testProjectId,
      assigned_to: testAssigneeId
    };

    const result = await createTask(testInput, testUserId);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.status).toEqual('todo');
    expect(result.priority).toEqual('medium');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.project_id).toEqual(testProjectId);
    expect(result.assigned_to).toEqual(testAssigneeId);
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal data', async () => {
    const testInput: CreateTaskInput = {
      title: 'Minimal Task',
      description: null,
      status: 'in_progress',
      priority: 'high',
      due_date: null,
      project_id: testProjectId,
      assigned_to: null
    };

    const result = await createTask(testInput, testUserId);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('in_progress');
    expect(result.priority).toEqual('high');
    expect(result.due_date).toBeNull();
    expect(result.assigned_to).toBeNull();
    expect(result.project_id).toEqual(testProjectId);
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
  });

  it('should save task to database', async () => {
    const testInput: CreateTaskInput = {
      title: 'Database Task',
      description: 'Testing database persistence',
      status: 'completed',
      priority: 'urgent',
      due_date: new Date('2024-06-15'),
      project_id: testProjectId,
      assigned_to: testAssigneeId
    };

    const result = await createTask(testInput, testUserId);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Task');
    expect(tasks[0].description).toEqual('Testing database persistence');
    expect(tasks[0].status).toEqual('completed');
    expect(tasks[0].priority).toEqual('urgent');
    expect(tasks[0].due_date).toBeInstanceOf(Date);
    expect(tasks[0].project_id).toEqual(testProjectId);
    expect(tasks[0].assigned_to).toEqual(testAssigneeId);
    expect(tasks[0].created_by).toEqual(testUserId);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle all task statuses and priorities', async () => {
    const statuses = ['todo', 'in_progress', 'completed', 'cancelled'] as const;
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;

    for (const status of statuses) {
      for (const priority of priorities) {
        const testInput: CreateTaskInput = {
          title: `Task ${status} ${priority}`,
          description: `Testing ${status} status with ${priority} priority`,
          status,
          priority,
          due_date: new Date(),
          project_id: testProjectId,
          assigned_to: testAssigneeId
        };

        const result = await createTask(testInput, testUserId);

        expect(result.status).toEqual(status);
        expect(result.priority).toEqual(priority);
        expect(result.title).toEqual(`Task ${status} ${priority}`);
      }
    }
  });
});
