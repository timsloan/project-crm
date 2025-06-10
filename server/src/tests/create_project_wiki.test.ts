
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, projectsTable, projectWikiTable, teamsTable } from '../db/schema';
import { type CreateProjectWikiInput } from '../schema';
import { createProjectWiki } from '../handlers/create_project_wiki';
import { eq } from 'drizzle-orm';

describe('createProjectWiki', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project wiki entry', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: null
      })
      .returning()
      .execute();

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A test team'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: team[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: '10000.50',
        start_date: new Date(),
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateProjectWikiInput = {
      project_id: project[0].id,
      title: 'Getting Started',
      content: 'This is the initial project documentation.',
      created_by: user[0].id
    };

    const result = await createProjectWiki(testInput);

    // Basic field validation
    expect(result.project_id).toEqual(project[0].id);
    expect(result.title).toEqual('Getting Started');
    expect(result.content).toEqual('This is the initial project documentation.');
    expect(result.version).toEqual(1);
    expect(result.created_by).toEqual(user[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save project wiki to database', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: null
      })
      .returning()
      .execute();

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A test team'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: team[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: '10000.50',
        start_date: new Date(),
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateProjectWikiInput = {
      project_id: project[0].id,
      title: 'Getting Started',
      content: 'This is the initial project documentation.',
      created_by: user[0].id
    };

    const result = await createProjectWiki(testInput);

    // Query the database to verify
    const wikiEntries = await db.select()
      .from(projectWikiTable)
      .where(eq(projectWikiTable.id, result.id))
      .execute();

    expect(wikiEntries).toHaveLength(1);
    expect(wikiEntries[0].project_id).toEqual(project[0].id);
    expect(wikiEntries[0].title).toEqual('Getting Started');
    expect(wikiEntries[0].content).toEqual('This is the initial project documentation.');
    expect(wikiEntries[0].version).toEqual(1);
    expect(wikiEntries[0].created_by).toEqual(user[0].id);
    expect(wikiEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should create wiki entry with version 1', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: null
      })
      .returning()
      .execute();

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A test team'
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        team_id: team[0].id
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        status: 'planning',
        estimated_value: '10000.50',
        start_date: new Date(),
        end_date: null,
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateProjectWikiInput = {
      project_id: project[0].id,
      title: 'API Documentation',
      content: 'Comprehensive API documentation for the project.',
      created_by: user[0].id
    };

    const result = await createProjectWiki(testInput);

    // Verify version is set to 1 for new wiki entry
    expect(result.version).toEqual(1);
    expect(result.title).toEqual('API Documentation');
    expect(result.content).toEqual('Comprehensive API documentation for the project.');
  });
});
