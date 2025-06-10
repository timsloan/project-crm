
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { createCompany } from '../handlers/create_company';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCompanyInput = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://test.com'
};

describe('createCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a company', async () => {
    const result = await createCompany(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Company');
    expect(result.industry).toEqual('Technology');
    expect(result.website).toEqual('https://test.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save company to database', async () => {
    const result = await createCompany(testInput);

    // Query using proper drizzle syntax
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, result.id))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Test Company');
    expect(companies[0].industry).toEqual('Technology');
    expect(companies[0].website).toEqual('https://test.com');
    expect(companies[0].created_at).toBeInstanceOf(Date);
    expect(companies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle company with null optional fields', async () => {
    const minimalInput: CreateCompanyInput = {
      name: 'Minimal Company',
      industry: null,
      website: null
    };

    const result = await createCompany(minimalInput);

    expect(result.name).toEqual('Minimal Company');
    expect(result.industry).toBeNull();
    expect(result.website).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
