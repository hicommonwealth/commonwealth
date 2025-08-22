import { Sequelize, QueryTypes } from 'sequelize';
import fs from 'fs';

// Database configuration - using the same defaults as the project
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://commonwealth:edgeware@localhost/commonwealth';

const sequelize = new Sequelize(DATABASE_URL, {
  logging: console.log, // Enable query logging
  dialectOptions: {
    requestTimeout: 40000,
    ssl: false
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  },
});

const queries = [
  {
    name: "Query 1: General leaderboard without quest filter (most common usage)",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
with full_ranking as (
	select
		id as user_id,
		coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) as xp_points,
		tier,
		profile->>'name' as user_name,
		profile->>'avatar_url' as avatar_url,
		(ROW_NUMBER() OVER (ORDER BY coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) DESC, id ASC))::int as rank
	from
		"Users" U
	where tier != 0
)
select * from full_ranking
ORDER BY rank ASC
LIMIT 50 OFFSET 0;
`
  },
  {
    name: "Query 2: General leaderboard COUNT query (for pagination)",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
SELECT COUNT(*) FROM (
	with full_ranking as (
		select
			id as user_id,
			coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) as xp_points,
			tier,
			profile->>'name' as user_name,
			profile->>'avatar_url' as avatar_url,
			(ROW_NUMBER() OVER (ORDER BY coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) DESC, id ASC))::int as rank
		from
			"Users" U
		where tier != 0
	)
	select * from full_ranking
) as count_table;
`
  },
  {
    name: "Query 3: Quest-specific leaderboard (complex query with multiple joins)",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
with
as_user as (
	select
		l.user_id,
		sum(l.xp_points)::int as xp_points
	from
		"XpLogs" l
		join "QuestActionMetas" m on l.action_meta_id = m.id
		join "Quests" q on m.quest_id = q.id
	  join "Users" u on l.user_id = u.id 
	where
		q.id = 1  -- Example quest ID
		AND u.tier != 0
	group by
		l.user_id
),
as_creator as (
	select
		l.creator_user_id as user_id,
		sum(l.creator_xp_points)::int as xp_points
	from
		"XpLogs" l
		join "QuestActionMetas" m on l.action_meta_id = m.id
		join "Quests" q on m.quest_id = q.id
	  join "Users" u on l.creator_user_id = u.id 
	where
		q.id = 1  -- Example quest ID
		AND u.tier != 0
	group by
		l.creator_user_id
),
ranked_users as (
	select
		coalesce(u.user_id, c.user_id) as user_id,
		coalesce(u.xp_points, 0) + coalesce(c.xp_points, 0) as xp_points
	from
		as_user u
		full outer join as_creator c on u.user_id = c.user_id
),
full_ranking as (
	select
		r.user_id,
		r.xp_points,
		u.tier,
		u.profile->>'name' as user_name,
		u.profile->>'avatar_url' as avatar_url,
		(ROW_NUMBER() OVER (ORDER BY r.xp_points DESC, r.user_id ASC))::int as rank
	from
		ranked_users r
		join "Users" u on r.user_id = u.id
	where 1=1
)
select * from full_ranking
ORDER BY rank ASC
LIMIT 50 OFFSET 0;
`
  },
  {
    name: "Query 4: User-specific ranking lookup (single user)",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
with full_ranking as (
	select
		id as user_id,
		coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) as xp_points,
		tier,
		profile->>'name' as user_name,
		profile->>'avatar_url' as avatar_url,
		(ROW_NUMBER() OVER (ORDER BY coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) DESC, id ASC))::int as rank
	from
		"Users" U
	where tier != 0
)
select * from full_ranking
where user_id = 123;  -- Example user ID
`
  },
  {
    name: "Query 5: Search functionality with ILIKE",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
with full_ranking as (
	select
		id as user_id,
		coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) as xp_points,
		tier,
		profile->>'name' as user_name,
		profile->>'avatar_url' as avatar_url,
		(ROW_NUMBER() OVER (ORDER BY coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) DESC, id ASC))::int as rank
	from
		"Users" U
	where tier != 0 AND LOWER(U.profile->>'name') LIKE LOWER('%john%')
)
select * from full_ranking
ORDER BY rank ASC
LIMIT 50 OFFSET 0;
`
  }
];

const tableInfoQueries = [
  {
    name: "Users table structure",
    sql: `SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'Users' 
    ORDER BY ordinal_position;`
  },
  {
    name: "Users table indexes",
    sql: `SELECT 
      indexname, 
      indexdef 
    FROM pg_indexes 
    WHERE tablename = 'Users';`
  },
  {
    name: "XpLogs table structure", 
    sql: `SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'XpLogs' 
    ORDER BY ordinal_position;`
  },
  {
    name: "XpLogs table indexes",
    sql: `SELECT 
      indexname, 
      indexdef 
    FROM pg_indexes 
    WHERE tablename = 'XpLogs';`
  },
  {
    name: "Table sizes",
    sql: `SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
    FROM pg_tables 
    WHERE tablename IN ('Users', 'XpLogs', 'QuestActionMetas', 'Quests')
    ORDER BY size_bytes DESC;`
  },
  {
    name: "Table row counts",
    sql: `SELECT 
      'Users' as table_name, COUNT(*) as row_count FROM "Users"
    UNION ALL
    SELECT 
      'XpLogs' as table_name, COUNT(*) as row_count FROM "XpLogs"
    UNION ALL  
    SELECT 
      'QuestActionMetas' as table_name, COUNT(*) as row_count FROM "QuestActionMetas"
    UNION ALL
    SELECT 
      'Quests' as table_name, COUNT(*) as row_count FROM "Quests";`
  }
];

async function runAnalysis() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    let output = '# Query Plan Analysis for GetXpsRanked PR #12857\n\n';
    output += `Analysis run at: ${new Date().toISOString()}\n\n`;

    // First, get table information
    console.log('\n=== Gathering Table Information ===');
    output += '## Table Information\n\n';
    
    for (const query of tableInfoQueries) {
      console.log(`Running: ${query.name}`);
      try {
        const results = await sequelize.query(query.sql, {
          type: QueryTypes.SELECT,
          raw: true,
        });
        
        output += `### ${query.name}\n\n`;
        output += '```\n';
        output += JSON.stringify(results, null, 2);
        output += '\n```\n\n';
      } catch (error) {
        console.error(`Error in ${query.name}:`, error.message);
        output += `### ${query.name} - ERROR\n\n`;
        output += `Error: ${error.message}\n\n`;
      }
    }

    // Now run the main query plans
    console.log('\n=== Running Query Plans ===');
    output += '## Query Plan Analysis\n\n';
    
    for (const query of queries) {
      console.log(`Running: ${query.name}`);
      try {
        const results = await sequelize.query(query.sql, {
          type: QueryTypes.SELECT,
          raw: true,
        });
        
        output += `### ${query.name}\n\n`;
        output += '```json\n';
        output += JSON.stringify(results[0], null, 2);
        output += '\n```\n\n';
        
        // Extract key metrics from the plan
        if (results[0] && results[0]['QUERY PLAN']) {
          const plan = results[0]['QUERY PLAN'][0];
          if (plan['Execution Time']) {
            output += `**Execution Time:** ${plan['Execution Time']} ms\n`;
          }
          if (plan['Planning Time']) {
            output += `**Planning Time:** ${plan['Planning Time']} ms\n`;
          }
          output += '\n';
        }
        
      } catch (error) {
        console.error(`Error in ${query.name}:`, error.message);
        output += `### ${query.name} - ERROR\n\n`;
        output += `Error: ${error.message}\n\n`;
        
        // If it's a missing table/data error, that's still useful information
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          output += `This indicates the table doesn't exist yet, which is expected in a development environment.\n\n`;
        }
      }
    }

    // Write results to file
    fs.writeFileSync('/workspace/query_plans_analysis.md', output);
    console.log('\nAnalysis complete! Results written to query_plans_analysis.md');
    
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    
    // Write error information
    const errorOutput = `# Query Plan Analysis - Database Connection Error\n\n` +
      `Error: ${error.message}\n\n` +
      `This indicates that the database is not currently running or accessible.\n` +
      `To run this analysis, you would need to:\n` +
      `1. Start the PostgreSQL database\n` +
      `2. Ensure the database contains the necessary tables (Users, XpLogs, QuestActionMetas, Quests)\n` +
      `3. Run this script again\n\n` +
      `However, I can still provide analysis based on the query structure...\n`;
    
    fs.writeFileSync('/workspace/query_plans_analysis.md', errorOutput);
  } finally {
    await sequelize.close();
  }
}

runAnalysis();