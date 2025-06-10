
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput, type Company } from '../schema';

export const createCompany = async (input: CreateCompanyInput): Promise<Company> => {
  try {
    // Insert company record
    const result = await db.insert(companiesTable)
      .values({
        name: input.name,
        industry: input.industry,
        website: input.website
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Company creation failed:', error);
    throw error;
  }
};
