
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        name: input.name,
        description: input.description,
        status: input.status, // Zod default applied: 'planning'
        estimated_value: input.estimated_value ? input.estimated_value.toString() : null, // Convert number to string for numeric column
        start_date: input.start_date,
        end_date: input.end_date,
        company_id: input.company_id,
        created_by: input.created_by
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const project = result[0];
    return {
      ...project,
      estimated_value: project.estimated_value ? parseFloat(project.estimated_value) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};
