
import { db } from '../db';
import { notesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // Update the note
    const result = await db.update(notesTable)
      .set({
        content: input.content,
        updated_at: new Date()
      })
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
