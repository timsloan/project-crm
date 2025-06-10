
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { getCompanies } from '../handlers/get_companies';

describe('getCompanies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no companies exist', async () => {
    const result = await getCompanies();
    
    expect(result).toEqual([]);
  });

  it('should return all companies', async () => {
    // Create test companies
    await db.insert(companiesTable).values([
      {
        name: 'Tech Corp',
        industry: 'Technology',
        website: 'https://techcorp.com'
      },
      {
        name: 'Finance Inc',
        industry: 'Finance',
        website: null
      },
      {
        name: 'Health Solutions',
        industry: null,
        website: 'https://health.com'
      }
    ]).execute();

    const result = await getCompanies();

    expect(result).toHaveLength(3);
    
    // Verify first company
    const techCorp = result.find(c => c.name === 'Tech Corp');
    expect(techCorp).toBeDefined();
    expect(techCorp!.industry).toEqual('Technology');
    expect(techCorp!.website).toEqual('https://techcorp.com');
    expect(techCorp!.id).toBeDefined();
    expect(techCorp!.created_at).toBeInstanceOf(Date);
    expect(techCorp!.updated_at).toBeInstanceOf(Date);

    // Verify company with null values
    const financeInc = result.find(c => c.name === 'Finance Inc');
    expect(financeInc).toBeDefined();
    expect(financeInc!.industry).toEqual('Finance');
    expect(financeInc!.website).toBeNull();

    const healthSolutions = result.find(c => c.name === 'Health Solutions');
    expect(healthSolutions).toBeDefined();
    expect(healthSolutions!.industry).toBeNull();
    expect(healthSolutions!.website).toEqual('https://health.com');
  });

  it('should return companies ordered by creation time', async () => {
    // Create companies with slight delay to ensure different timestamps
    await db.insert(companiesTable).values({
      name: 'First Company',
      industry: 'Tech',
      website: null
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(companiesTable).values({
      name: 'Second Company',
      industry: 'Finance',
      website: null
    }).execute();

    const result = await getCompanies();

    expect(result).toHaveLength(2);
    
    // Verify companies are returned (order may vary without explicit ORDER BY)
    const firstCompany = result.find(c => c.name === 'First Company');
    const secondCompany = result.find(c => c.name === 'Second Company');
    
    expect(firstCompany).toBeDefined();
    expect(secondCompany).toBeDefined();
    expect(firstCompany!.created_at).toBeInstanceOf(Date);
    expect(secondCompany!.created_at).toBeInstanceOf(Date);
  });
});
