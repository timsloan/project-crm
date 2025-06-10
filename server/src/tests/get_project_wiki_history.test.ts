
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, projectsTable, projectWikiTable } from '../db/schema';
import { type GetProjectWikiHistoryInput } from '../schema';
import { getProjectWikiHistory } from '../handlers/get_project_wiki_history';

describe('getProjectWikiHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return wiki history ordered by version descending', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create multiple wiki entries with different versions
    await db.insert(projectWikiTable)
      .values([
        {
          project_id: project[0].id,
          title: 'Initial Wiki',
          content: 'First version of the wiki',
          version: 1,
          created_by: user[0].id
        },
        {
          project_id: project[0].id,
          title: 'Updated Wiki',
          content: 'Second version of the wiki',
          version: 2,
          created_by: user[0].id
        },
        {
          project_id: project[0].id,
          title: 'Latest Wiki',
          content: 'Third version of the wiki',
          version: 3,
          created_by: user[0].id
        }
      ])
      .execute();

    const input: GetProjectWikiHistoryInput = {
      project_id: project[0].id
    };

    const result = await getProjectWikiHistory(input);

    // Should return all wiki entries ordered by version descending
    expect(result).toHaveLength(3);
    expect(result[0].version).toEqual(3);
    expect(result[0].title).toEqual('Latest Wiki');
    expect(result[1].version).toEqual(2);
    expect(result[1].title).toEqual('Updated Wiki');
    expect(result[2].version).toEqual(1);
    expect(result[2].title).toEqual('Initial Wiki');

    // Verify all required fields are present
    result.forEach(wiki => {
      expect(wiki.id).toBeDefined();
      expect(wiki.project_id).toEqual(project[0].id);
      expect(wiki.title).toBeDefined();
      expect(wiki.content).toBeDefined();
      expect(wiki.version).toBeDefined();
      expect(wiki.created_by).toEqual(user[0].id);
      expect(wiki.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for project with no wiki entries', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        company_id: company[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    const input: GetProjectWikiHistoryInput = {
      project_id: project[0].id
    };

    const result = await getProjectWikiHistory(input);

    expect(result).toHaveLength(0);
  });

  it('should only return wiki entries for the specified project', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const projects = await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          company_id: company[0].id,
          created_by: user[0].id
        },
        {
          name: 'Project 2',
          company_id: company[0].id,
          created_by: user[0].id
        }
      ])
      .returning()
      .execute();

    // Create wiki entries for both projects
    await db.insert(projectWikiTable)
      .values([
        {
          project_id: projects[0].id,
          title: 'Project 1 Wiki',
          content: 'Wiki for project 1',
          version: 1,
          created_by: user[0].id
        },
        {
          project_id: projects[1].id,
          title: 'Project 2 Wiki',
          content: 'Wiki for project 2',
          version: 1,
          created_by: user[0].id
        }
      ])
      .execute();

    const input: GetProjectWikiHistoryInput = {
      project_id: projects[0].id
    };

    const result = await getProjectWikiHistory(input);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toEqual(projects[0].id);
    expect(result[0].title).toEqual('Project 1 Wiki');
  });
});
