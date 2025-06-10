
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type GetProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const getProject = async (input: GetProjectInput): Promise<Project> => {
  try {
    const result = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    const project = result[0];
    return {
      ...project,
      estimated_value: project.estimated_value ? parseFloat(project.estimated_value) : null
    };
  } catch (error) {
    console.error('Get project failed:', error);
    throw error;
  }
};
