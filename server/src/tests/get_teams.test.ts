
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { getTeams } from '../handlers/get_teams';

describe('getTeams', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no teams exist', async () => {
    const result = await getTeams();
    expect(result).toEqual([]);
  });

  it('should return all teams', async () => {
    // Create test teams
    await db.insert(teamsTable).values([
      {
        name: 'Engineering Team',
        description: 'Software development team'
      },
      {
        name: 'Marketing Team',
        description: 'Product marketing team'
      }
    ]).execute();

    const result = await getTeams();

    expect(result).toHaveLength(2);
    
    // Check first team
    const engineeringTeam = result.find(team => team.name === 'Engineering Team');
    expect(engineeringTeam).toBeDefined();
    expect(engineeringTeam!.description).toEqual('Software development team');
    expect(engineeringTeam!.id).toBeDefined();
    expect(engineeringTeam!.created_at).toBeInstanceOf(Date);
    expect(engineeringTeam!.updated_at).toBeInstanceOf(Date);

    // Check second team
    const marketingTeam = result.find(team => team.name === 'Marketing Team');
    expect(marketingTeam).toBeDefined();
    expect(marketingTeam!.description).toEqual('Product marketing team');
    expect(marketingTeam!.id).toBeDefined();
    expect(marketingTeam!.created_at).toBeInstanceOf(Date);
    expect(marketingTeam!.updated_at).toBeInstanceOf(Date);
  });

  it('should return teams with null descriptions', async () => {
    // Create team with null description
    await db.insert(teamsTable).values({
      name: 'Support Team',
      description: null
    }).execute();

    const result = await getTeams();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Support Team');
    expect(result[0].description).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
