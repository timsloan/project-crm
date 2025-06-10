
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, projectsTable, notesTable, teamsTable } from '../db/schema';
import { type GetProjectNotesInput } from '../schema';
import { getProjectNotes } from '../handlers/get_project_notes';

describe('getProjectNotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCompanyId: number;
  let testUserId: number;
  let testUser2Id: number;
  let testProjectId: number;

  beforeEach(async () => {
    // Create test company
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com'
      })
      .returning()
      .execute();
    testCompanyId = company[0].id;

    // Create test team
    const team = await db.insert(teamsTable)
      .values({
        name: 'Development Team',
        description: 'Software development team'
      })
      .returning()
      .execute();

    // Create test users
    const user1 = await db.insert(usersTable)
      .values({
        email: 'user1@test.com',
        first_name: 'User',
        last_name: 'One',
        team_id: team[0].id
      })
      .returning()
      .execute();
    testUserId = user1[0].id;

    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@test.com',
        first_name: 'User',
        last_name: 'Two',
        team_id: team[0].id
      })
      .returning()
      .execute();
    testUser2Id = user2[0].id;

    // Create test project
    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'active',
        company_id: testCompanyId,
        created_by: testUserId
      })
      .returning()
      .execute();
    testProjectId = project[0].id;
  });

  it('should return public notes for any user', async () => {
    // Create public notes
    await db.insert(notesTable)
      .values([
        {
          content: 'Public note 1',
          is_private: false,
          project_id: testProjectId,
          created_by: testUserId
        },
        {
          content: 'Public note 2',
          is_private: false,
          project_id: testProjectId,
          created_by: testUser2Id
        }
      ])
      .execute();

    const input: GetProjectNotesInput = {
      project_id: testProjectId,
      user_id: testUserId
    };

    const result = await getProjectNotes(input);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('Public note 1');
    expect(result[0].is_private).toBe(false);
    expect(result[1].content).toEqual('Public note 2');
    expect(result[1].is_private).toBe(false);
  });

  it('should return private notes only for the creator', async () => {
    // Create private notes by different users
    await db.insert(notesTable)
      .values([
        {
          content: 'Private note by user 1',
          is_private: true,
          project_id: testProjectId,
          created_by: testUserId
        },
        {
          content: 'Private note by user 2',
          is_private: true,
          project_id: testProjectId,
          created_by: testUser2Id
        }
      ])
      .execute();

    // User 1 should only see their own private note
    const input1: GetProjectNotesInput = {
      project_id: testProjectId,
      user_id: testUserId
    };

    const result1 = await getProjectNotes(input1);

    expect(result1).toHaveLength(1);
    expect(result1[0].content).toEqual('Private note by user 1');
    expect(result1[0].created_by).toEqual(testUserId);

    // User 2 should only see their own private note
    const input2: GetProjectNotesInput = {
      project_id: testProjectId,
      user_id: testUser2Id
    };

    const result2 = await getProjectNotes(input2);

    expect(result2).toHaveLength(1);
    expect(result2[0].content).toEqual('Private note by user 2');
    expect(result2[0].created_by).toEqual(testUser2Id);
  });

  it('should return both public and own private notes', async () => {
    // Create mix of public and private notes
    await db.insert(notesTable)
      .values([
        {
          content: 'Public note',
          is_private: false,
          project_id: testProjectId,
          created_by: testUser2Id
        },
        {
          content: 'My private note',
          is_private: true,
          project_id: testProjectId,
          created_by: testUserId
        },
        {
          content: 'Someone else private note',
          is_private: true,
          project_id: testProjectId,
          created_by: testUser2Id
        }
      ])
      .execute();

    const input: GetProjectNotesInput = {
      project_id: testProjectId,
      user_id: testUserId
    };

    const result = await getProjectNotes(input);

    expect(result).toHaveLength(2);
    
    // Should include the public note and own private note
    const contents = result.map(note => note.content);
    expect(contents).toContain('Public note');
    expect(contents).toContain('My private note');
    expect(contents).not.toContain('Someone else private note');
  });

  it('should return empty array for project with no notes', async () => {
    const input: GetProjectNotesInput = {
      project_id: testProjectId,
      user_id: testUserId
    };

    const result = await getProjectNotes(input);

    expect(result).toHaveLength(0);
  });

  it('should order notes by creation date', async () => {
    // Create notes with slight delay to ensure different timestamps
    const note1 = await db.insert(notesTable)
      .values({
        content: 'First note',
        is_private: false,
        project_id: testProjectId,
        created_by: testUserId
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(notesTable)
      .values({
        content: 'Second note',
        is_private: false,
        project_id: testProjectId,
        created_by: testUserId
      })
      .execute();

    const input: GetProjectNotesInput = {
      project_id: testProjectId,
      user_id: testUserId
    };

    const result = await getProjectNotes(input);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('First note');
    expect(result[1].content).toEqual('Second note');
    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
  });

  it('should validate all required note fields are returned', async () => {
    await db.insert(notesTable)
      .values({
        content: 'Test note content',
        is_private: false,
        project_id: testProjectId,
        created_by: testUserId
      })
      .execute();

    const input: GetProjectNotesInput = {
      project_id: testProjectId,
      user_id: testUserId
    };

    const result = await getProjectNotes(input);

    expect(result).toHaveLength(1);
    const note = result[0];
    expect(note.id).toBeDefined();
    expect(note.content).toEqual('Test note content');
    expect(note.is_private).toBe(false);
    expect(note.project_id).toEqual(testProjectId);
    expect(note.created_by).toEqual(testUserId);
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);
  });
});
