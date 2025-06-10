import { db } from '../db';
import { usersTable, authUsersTable } from '../db/schema';
import { type LoginInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

// Simple hash function for demo purposes (in production, use bcrypt)
const simpleHash = (password: string): string => {
  // This is NOT secure - just for demo purposes
  return Buffer.from(password + 'salt').toString('base64');
};

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    // Find auth user by email
    const authUserResult = await db.select()
      .from(authUsersTable)
      .where(eq(authUsersTable.email, input.email))
      .limit(1)
      .execute();

    if (authUserResult.length === 0) {
      throw new Error('Invalid email or password');
    }

    const authUser = authUserResult[0];

    // Verify password
    const hashedInput = simpleHash(input.password);
    if (hashedInput !== authUser.hashed_password) {
      throw new Error('Invalid email or password');
    }

    // Get user details
    const userResult = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, authUser.user_id))
      .limit(1)
      .execute();

    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult[0];

    return {
      user: user
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};