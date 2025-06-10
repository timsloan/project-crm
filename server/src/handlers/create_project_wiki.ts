
import { db } from '../db';
import { projectWikiTable } from '../db/schema';
import { type CreateProjectWikiInput, type ProjectWiki } from '../schema';

export const createProjectWiki = async (input: CreateProjectWikiInput, currentUserId: number): Promise<ProjectWiki> => {
  try {
    // Insert project wiki record
    const result = await db.insert(projectWikiTable)
      .values({
        project_id: input.project_id,
        title: input.title,
        content: input.content,
        version: 1, // First version
        created_by: currentUserId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Project wiki creation failed:', error);
    throw error;
  }
};
