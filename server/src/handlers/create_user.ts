
import { db } from '../db';
import { usersTable, teamsTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Validate team exists if team_id is provided
    if (input.team_id !== null) {
      const team = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.id, input.team_id))
        .execute();
      
      if (team.length === 0) {
        throw new Error(`Team with id ${input.team_id} does not exist`);
      }
    }

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        team_id: input.team_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
