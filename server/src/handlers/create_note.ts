
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // Insert note record
    const result = await db.insert(notesTable)
      .values({
        content: input.content,
        is_private: input.is_private,
        project_id: input.project_id,
        created_by: input.created_by
      })
      .returning()
      .execute();

    const note = result[0];
    return note;
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
