
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teamsTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create a team first for foreign key reference
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        description: 'A team for testing'
      })
      .returning()
      .execute();

    const teamId = teamResult[0].id;

    // Create test users
    await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          team_id: teamId
        },
        {
          email: 'user2@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          team_id: null
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    const user1 = result.find(u => u.email === 'user1@example.com');
    expect(user1).toBeDefined();
    expect(user1!.first_name).toEqual('John');
    expect(user1!.last_name).toEqual('Doe');
    expect(user1!.team_id).toEqual(teamId);
    expect(user1!.id).toBeDefined();
    expect(user1!.created_at).toBeInstanceOf(Date);
    expect(user1!.updated_at).toBeInstanceOf(Date);

    // Check second user
    const user2 = result.find(u => u.email === 'user2@example.com');
    expect(user2).toBeDefined();
    expect(user2!.first_name).toEqual('Jane');
    expect(user2!.last_name).toEqual('Smith');
    expect(user2!.team_id).toBeNull();
    expect(user2!.id).toBeDefined();
    expect(user2!.created_at).toBeInstanceOf(Date);
    expect(user2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return users with proper field types', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        team_id: null
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    // Verify field types
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.first_name).toBe('string');
    expect(typeof user.last_name).toBe('string');
    expect(user.team_id).toBeNull();
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});
