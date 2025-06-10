
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetProjectTasksInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectTasks = async (input: GetProjectTasksInput): Promise<Task[]> => {
  try {
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.project_id, input.project_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get project tasks:', error);
    throw error;
  }
};
