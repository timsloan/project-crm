
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetProjectNotesInput, type Note } from '../schema';
import { eq, and, or } from 'drizzle-orm';

export const getProjectNotes = async (input: GetProjectNotesInput, currentUserId: number): Promise<Note[]> => {
  try {
    // Get all notes for the project that are either:
    // 1. Public notes (is_private = false), OR
    // 2. Private notes created by the requesting user
    const results = await db.select()
      .from(notesTable)
      .where(
        and(
          eq(notesTable.project_id, input.project_id),
          or(
            eq(notesTable.is_private, false),
            and(
              eq(notesTable.is_private, true),
              eq(notesTable.created_by, currentUserId)
            )
          )
        )
      )
      .orderBy(notesTable.created_at)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get project notes:', error);
    throw error;
  }
};
