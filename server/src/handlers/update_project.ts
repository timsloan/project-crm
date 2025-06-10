
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    
    if (input.estimated_value !== undefined) {
      updateData.estimated_value = input.estimated_value?.toString() || null;
    }
    
    if (input.start_date !== undefined) {
      updateData.start_date = input.start_date;
    }
    
    if (input.end_date !== undefined) {
      updateData.end_date = input.end_date;
    }
    
    if (input.company_id !== undefined) {
      updateData.company_id = input.company_id;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update project record
    const result = await db.update(projectsTable)
      .set(updateData)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    // Convert numeric field back to number before returning
    const project = result[0];
    return {
      ...project,
      estimated_value: project.estimated_value ? parseFloat(project.estimated_value) : null
    };
  } catch (error) {
    console.error('Project update failed:', error);
    throw error;
  }
};
