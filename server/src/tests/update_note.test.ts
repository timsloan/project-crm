
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, projectsTable, notesTable, teamsTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a note content', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [team] = await db.insert(teamsTable)
      .values({ name: 'Test Team' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: team.id
      })
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const [note] = await db.insert(notesTable)
      .values({
        content: 'Original content',
        project_id: project.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const updateInput: UpdateNoteInput = {
      id: note.id,
      content: 'Updated content'
    };

    const result = await updateNote(updateInput);

    // Verify updated content
    expect(result.id).toEqual(note.id);
    expect(result.content).toEqual('Updated content');
    expect(result.project_id).toEqual(project.id);
    expect(result.created_by).toEqual(user.id);
    expect(result.is_private).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > note.updated_at).toBe(true);
  });

  it('should save updated note to database', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [team] = await db.insert(teamsTable)
      .values({ name: 'Test Team' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: team.id
      })
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const [note] = await db.insert(notesTable)
      .values({
        content: 'Original content',
        project_id: project.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const updateInput: UpdateNoteInput = {
      id: note.id,
      content: 'Updated content from database test'
    };

    await updateNote(updateInput);

    // Verify in database
    const updatedNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();

    expect(updatedNotes).toHaveLength(1);
    expect(updatedNotes[0].content).toEqual('Updated content from database test');
    expect(updatedNotes[0].updated_at).toBeInstanceOf(Date);
    expect(updatedNotes[0].updated_at > note.updated_at).toBe(true);
  });

  it('should throw error when note not found', async () => {
    const updateInput: UpdateNoteInput = {
      id: 999,
      content: 'Updated content'
    };

    await expect(updateNote(updateInput)).rejects.toThrow(/Note with id 999 not found/i);
  });
});
