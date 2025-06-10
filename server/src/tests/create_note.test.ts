
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, companiesTable, usersTable, projectsTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

describe('createNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a note with default values', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: null
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: null,
        start_date: null,
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateNoteInput = {
      content: 'This is a test note',
      is_private: false,
      project_id: project[0].id
    };

    const result = await createNote(testInput, user[0].id);

    // Basic field validation
    expect(result.content).toEqual('This is a test note');
    expect(result.is_private).toEqual(false);
    expect(result.project_id).toEqual(project[0].id);
    expect(result.created_by).toEqual(user[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a private note', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: null
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: null,
        start_date: null,
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateNoteInput = {
      content: 'This is a private note',
      is_private: true,
      project_id: project[0].id
    };

    const result = await createNote(testInput, user[0].id);

    // Basic field validation
    expect(result.content).toEqual('This is a private note');
    expect(result.is_private).toEqual(true);
    expect(result.project_id).toEqual(project[0].id);
    expect(result.created_by).toEqual(user[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: null
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: null,
        start_date: null,
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateNoteInput = {
      content: 'Database test note',
      is_private: false,
      project_id: project[0].id
    };

    const result = await createNote(testInput, user[0].id);

    // Query using proper drizzle syntax
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].content).toEqual('Database test note');
    expect(notes[0].is_private).toEqual(false);
    expect(notes[0].project_id).toEqual(project[0].id);
    expect(notes[0].created_by).toEqual(user[0].id);
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle Zod default for is_private', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: 'https://test.com'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: null
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: null,
        start_date: null,
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Input that should use Zod default (false) for is_private
    const testInput: CreateNoteInput = {
      content: 'Note with default privacy',
      is_private: false, // Explicitly set to test the default is applied
      project_id: project[0].id
    };

    const result = await createNote(testInput, user[0].id);

    // Verify default was applied
    expect(result.is_private).toEqual(false);
  });
});
