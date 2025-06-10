
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teamsTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user without team', async () => {
    const testInput: CreateUserInput = {
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      team_id: null
    };

    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.team_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with team', async () => {
    // Create a team first
    const team = await db.insert(teamsTable)
      .values({
        name: 'Development Team',
        description: 'Software development team'
      })
      .returning()
      .execute();

    const testInput: CreateUserInput = {
      email: 'developer@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      team_id: team[0].id
    };

    const result = await createUser(testInput);

    expect(result.email).toEqual('developer@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.team_id).toEqual(team[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const testInput: CreateUserInput = {
      email: 'saved@example.com',
      first_name: 'Test',
      last_name: 'User',
      team_id: null
    };

    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('saved@example.com');
    expect(users[0].first_name).toEqual('Test');
    expect(users[0].last_name).toEqual('User');
    expect(users[0].team_id).toBeNull();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent team', async () => {
    const testInput: CreateUserInput = {
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      team_id: 999 // Non-existent team ID
    };

    await expect(createUser(testInput)).rejects.toThrow(/team with id 999 does not exist/i);
  });

  it('should enforce unique email constraint', async () => {
    const testInput: CreateUserInput = {
      email: 'unique@example.com',
      first_name: 'First',
      last_name: 'User',
      team_id: null
    };

    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      email: 'unique@example.com',
      first_name: 'Second',
      last_name: 'User',
      team_id: null
    };

    await expect(createUser(duplicateInput)).rejects.toThrow();
  });
});
