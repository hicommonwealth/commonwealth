-- Performance Indexes for GetXpsRanked PR #12857
-- Run these indexes to improve leaderboard query performance

-- Enable pg_trgm extension for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. PRIMARY INDEX: Users leaderboard sorting
-- This index supports the main ORDER BY clause used in ranking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_xp_total_desc_id_asc 
ON "Users" ((coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0)) DESC, id ASC) 
WHERE tier != 0;

-- 2. TIER FILTER INDEX: Fast filtering of non-banned users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tier_not_banned 
ON "Users" (tier) 
WHERE tier != 0;

-- 3. XP LOGS INDEXES: For quest-specific queries
-- Index for user XP aggregation by quest
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_xplogs_quest_user_xp 
ON "XpLogs" (action_meta_id, user_id) 
INCLUDE (xp_points)
WHERE xp_points > 0;

-- Index for creator XP aggregation by quest  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_xplogs_quest_creator_xp 
ON "XpLogs" (action_meta_id, creator_user_id) 
INCLUDE (creator_xp_points)
WHERE creator_xp_points > 0 AND creator_user_id IS NOT NULL;

-- 4. QUEST ACTION METAS INDEX: For joining XpLogs to Quests
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questactionmetas_quest_id 
ON "QuestActionMetas" (quest_id, id);

-- 5. SEARCH INDEX: For name search functionality
-- GIN index with trigram support for fast text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_name_search 
ON "Users" USING gin ((lower(profile->>'name')) gin_trgm_ops) 
WHERE tier != 0 AND profile->>'name' IS NOT NULL;

-- 6. USER ID INDEX: For user-specific rank lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_xp_tier 
ON "Users" (id) 
INCLUDE (xp_points, xp_referrer_points, tier, profile)
WHERE tier != 0;

-- 7. COMPOSITE INDEX: Users with XP data for faster CTE processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_xp_composite 
ON "Users" (tier, id) 
INCLUDE (xp_points, xp_referrer_points, profile)
WHERE tier != 0 AND (xp_points > 0 OR xp_referrer_points > 0);

-- Analyze tables after creating indexes
ANALYZE "Users";
ANALYZE "XpLogs";
ANALYZE "QuestActionMetas";
ANALYZE "Quests";

-- Check index usage (run after some queries have been executed)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE indexname LIKE 'idx_users_%' OR indexname LIKE 'idx_xplogs_%'
-- ORDER BY idx_scan DESC;