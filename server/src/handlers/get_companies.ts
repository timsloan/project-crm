
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type Company } from '../schema';

export const getCompanies = async (): Promise<Company[]> => {
  try {
    const result = await db.select()
      .from(companiesTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get companies:', error);
    throw error;
  }
};
