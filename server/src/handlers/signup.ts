import { db } from '../db';
import { usersTable, authUsersTable } from '../db/schema';
import { type SignupInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

// Simple hash function for demo purposes (in production, use bcrypt)
const simpleHash = (password: string): string => {
  // This is NOT secure - just for demo purposes
  return Buffer.from(password + 'salt').toString('base64');
};

export const signup = async (input: SignupInput): Promise<AuthResponse> => {
  try {
    // Check if user already exists
    const existingAuthUser = await db.select()
      .from(authUsersTable)
      .where(eq(authUsersTable.email, input.email))
      .limit(1)
      .execute();

    if (existingAuthUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = simpleHash(input.password);

    // Create user in users table first
    const userResult = await db.insert(usersTable)
      .values({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        team_id: null // No team assignment on signup
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create auth entry
    await db.insert(authUsersTable)
      .values({
        user_id: user.id,
        email: input.email,
        hashed_password: hashedPassword
      })
      .execute();

    return {
      user: user
    };
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
};