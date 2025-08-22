-- Query Plan Analysis for GetXpsRanked PR #12857
-- This script runs EXPLAIN ANALYZE on the main queries to identify performance bottlenecks

-- ============================================================================
-- Query 1: General leaderboard without quest filter (most common usage)
-- ============================================================================
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

-- ============================================================================
-- Query 2: General leaderboard COUNT query (for pagination)
-- ============================================================================
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

-- ============================================================================
-- Query 3: Quest-specific leaderboard (complex query with multiple joins)
-- ============================================================================
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

-- ============================================================================
-- Query 4: Quest-specific leaderboard COUNT query
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
SELECT COUNT(*) FROM (
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
) as count_table;

-- ============================================================================
-- Query 5: User-specific ranking lookup (single user)
-- ============================================================================
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

-- ============================================================================
-- Query 6: Search functionality with ILIKE
-- ============================================================================
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

-- ============================================================================
-- Additional queries to check index usage and table statistics
-- ============================================================================

-- Check existing indexes on critical tables
\d+ "Users"
\d+ "XpLogs"
\d+ "QuestActionMetas"
\d+ "Quests"

-- Table statistics
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE tablename IN ('Users', 'XpLogs', 'QuestActionMetas', 'Quests')
AND (attname LIKE '%xp%' OR attname LIKE '%id%' OR attname = 'tier');

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE tablename IN ('Users', 'XpLogs', 'QuestActionMetas', 'Quests')
ORDER BY size_bytes DESC;