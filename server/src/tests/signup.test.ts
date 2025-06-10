import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, authUsersTable } from '../db/schema';
import { type SignupInput } from '../schema';
import { signup } from '../handlers/signup';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

const testSignupInput: SignupInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
};

describe('signup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user and auth record', async () => {
    const result = await signup(testSignupInput);

    // Check user data
    expect(result.user.email).toEqual(testSignupInput.email);
    expect(result.user.first_name).toEqual(testSignupInput.first_name);
    expect(result.user.last_name).toEqual(testSignupInput.last_name);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);

    // Verify user was saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, testSignupInput.email))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual(testSignupInput.email);

    // Verify auth record was created
    const authUsers = await db.select()
      .from(authUsersTable)
      .where(eq(authUsersTable.email, testSignupInput.email))
      .execute();

    expect(authUsers).toHaveLength(1);
    expect(authUsers[0].user_id).toEqual(result.user.id);
    
    // Verify password was hashed
    const passwordMatch = await bcrypt.compare(testSignupInput.password, authUsers[0].hashed_password);
    expect(passwordMatch).toBe(true);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await signup(testSignupInput);

    // Try to create another user with same email
    const duplicateInput: SignupInput = {
      ...testSignupInput,
      first_name: 'Jane'
    };

    expect(signup(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle missing fields gracefully', async () => {
    const invalidInput = {
      email: 'test@example.com',
      password: '',
      first_name: 'John',
      last_name: 'Doe'
    };

    // This should be caught by Zod validation at the tRPC level
    // but we can test our handler's behavior
    expect(signup(invalidInput as SignupInput)).rejects.toThrow();
  });
});