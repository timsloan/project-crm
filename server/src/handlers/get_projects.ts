
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .execute();

    return results.map(project => ({
      ...project,
      estimated_value: project.estimated_value ? parseFloat(project.estimated_value) : null
    }));
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
};
