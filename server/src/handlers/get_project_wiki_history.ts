
import { db } from '../db';
import { projectWikiTable } from '../db/schema';
import { type GetProjectWikiHistoryInput, type ProjectWiki } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getProjectWikiHistory = async (input: GetProjectWikiHistoryInput): Promise<ProjectWiki[]> => {
  try {
    const results = await db.select()
      .from(projectWikiTable)
      .where(eq(projectWikiTable.project_id, input.project_id))
      .orderBy(desc(projectWikiTable.version))
      .execute();

    return results;
  } catch (error) {
    console.error('Get project wiki history failed:', error);
    throw error;
  }
};
