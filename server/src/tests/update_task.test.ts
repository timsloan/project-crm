
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, projectsTable, tasksTable, teamsTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testTaskId: number;
  let testUserId: number;
  let testProjectId: number;
  let testCompanyId: number;
  let testTeamId: number;

  beforeEach(async () => {
    // Create test team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();
    testTeamId = teamResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: testTeamId
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com'
      })
      .returning()
      .execute();
    testCompanyId = companyResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        status: 'planning',
        company_id: testCompanyId,
        created_by: testUserId
      })
      .returning()
      .execute();
    testProjectId = projectResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        status: 'todo',
        priority: 'medium',
        due_date: new Date('2024-01-15'),
        project_id: testProjectId,
        assigned_to: testUserId,
        created_by: testUserId
      })
      .returning()
      .execute();
    testTaskId = taskResult[0].id;
  });

  it('should update task title', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('todo');
    expect(result.priority).toEqual('medium');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task status and priority', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      status: 'in_progress',
      priority: 'high'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Original Task');
    expect(result.status).toEqual('in_progress');
    expect(result.priority).toEqual('high');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const newDueDate = new Date('2024-02-20');
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Completely Updated Task',
      description: 'New description',
      status: 'completed',
      priority: 'urgent',
      due_date: newDueDate,
      assigned_to: null
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Completely Updated Task');
    expect(result.description).toEqual('New description');
    expect(result.status).toEqual('completed');
    expect(result.priority).toEqual('urgent');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.assigned_to).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Database Update Test',
      status: 'cancelled'
    };

    await updateTask(input);

    // Verify changes in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Update Test');
    expect(tasks[0].status).toEqual('cancelled');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Timestamp Test'
    };

    const result = await updateTask(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask[0].updated_at.getTime());
  });

  it('should throw error for non-existent task', async () => {
    const input: UpdateTaskInput = {
      id: 99999,
      title: 'Non-existent Task'
    };

    await expect(updateTask(input)).rejects.toThrow(/Task with id 99999 not found/);
  });

  it('should handle nullable fields correctly', async () => {
    const input: UpdateTaskInput = {
      id: testTaskId,
      description: null,
      due_date: null,
      assigned_to: null
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.assigned_to).toBeNull();
  });
});
