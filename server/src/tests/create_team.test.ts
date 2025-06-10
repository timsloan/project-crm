
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { type CreateTeamInput } from '../schema';
import { createTeam } from '../handlers/create_team';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTeamInput = {
  name: 'Development Team',
  description: 'A team for software development'
};

describe('createTeam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a team', async () => {
    const result = await createTeam(testInput);

    // Basic field validation
    expect(result.name).toEqual('Development Team');
    expect(result.description).toEqual('A team for software development');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save team to database', async () => {
    const result = await createTeam(testInput);

    // Query using proper drizzle syntax
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, result.id))
      .execute();

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toEqual('Development Team');
    expect(teams[0].description).toEqual('A team for software development');
    expect(teams[0].created_at).toBeInstanceOf(Date);
    expect(teams[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create team with null description', async () => {
    const inputWithNullDescription: CreateTeamInput = {
      name: 'Marketing Team',
      description: null
    };

    const result = await createTeam(inputWithNullDescription);

    expect(result.name).toEqual('Marketing Team');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create team with minimal input', async () => {
    const minimalInput: CreateTeamInput = {
      name: 'Support Team',
      description: null
    };

    const result = await createTeam(minimalInput);

    // Verify all required fields exist
    expect(result.name).toEqual('Support Team');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, result.id))
      .execute();

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toEqual('Support Team');
    expect(teams[0].description).toBeNull();
  });
});
