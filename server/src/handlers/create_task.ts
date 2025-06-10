
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput, currentUserId: number): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description,
        status: input.status, // Zod default applied: 'todo'
        priority: input.priority, // Zod default applied: 'medium'
        due_date: input.due_date,
        project_id: input.project_id,
        assigned_to: input.assigned_to,
        created_by: currentUserId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
