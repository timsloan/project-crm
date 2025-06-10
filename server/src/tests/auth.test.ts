import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, authUsersTable } from '../db/schema';
import { type SignupInput, type LoginInput } from '../schema';
import { signup } from '../handlers/signup';
import { login } from '../handlers/login';
import { eq } from 'drizzle-orm';

const testUserData: SignupInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('Authentication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('signup', () => {
    it('should create a new user and auth record', async () => {
      const result = await signup(testUserData);

      // Check user data
      expect(result.user.email).toEqual(testUserData.email);
      expect(result.user.first_name).toEqual(testUserData.first_name);
      expect(result.user.last_name).toEqual(testUserData.last_name);
      expect(result.user.id).toBeDefined();
      expect(result.user.created_at).toBeInstanceOf(Date);

      // Verify user was saved to database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, testUserData.email))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].email).toEqual(testUserData.email);

      // Verify auth record was created
      const authUsers = await db.select()
        .from(authUsersTable)
        .where(eq(authUsersTable.email, testUserData.email))
        .execute();

      expect(authUsers).toHaveLength(1);
      expect(authUsers[0].user_id).toEqual(result.user.id);
      expect(authUsers[0].hashed_password).toBeDefined();
    });

    it('should reject duplicate email addresses', async () => {
      // Create first user
      await signup(testUserData);

      // Try to create another user with same email
      const duplicateInput: SignupInput = {
        ...testUserData,
        first_name: 'Jane'
      };

      expect(signup(duplicateInput)).rejects.toThrow(/already exists/i);
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      // Create user first
      const signupResult = await signup(testUserData);

      // Login with correct credentials
      const loginResult = await login(testLoginInput);

      expect(loginResult.user.id).toEqual(signupResult.user.id);
      expect(loginResult.user.email).toEqual(testUserData.email);
      expect(loginResult.user.first_name).toEqual(testUserData.first_name);
      expect(loginResult.user.last_name).toEqual(testUserData.last_name);
    });

    it('should reject incorrect email', async () => {
      // Create user first
      await signup(testUserData);

      // Try to login with wrong email
      const wrongEmailInput: LoginInput = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      expect(login(wrongEmailInput)).rejects.toThrow(/Invalid email or password/i);
    });

    it('should reject incorrect password', async () => {
      // Create user first
      await signup(testUserData);

      // Try to login with wrong password
      const wrongPasswordInput: LoginInput = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      expect(login(wrongPasswordInput)).rejects.toThrow(/Invalid email or password/i);
    });

    it('should reject login for non-existent user', async () => {
      const nonExistentInput: LoginInput = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      expect(login(nonExistentInput)).rejects.toThrow(/Invalid email or password/i);
    });
  });
});