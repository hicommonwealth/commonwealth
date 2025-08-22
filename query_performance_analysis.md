# Query Performance Analysis for PR #12857: Paginated Aura Leaderboard

## Executive Summary

This analysis examines the performance implications of the new paginated XP leaderboard queries introduced in PR #12857. The changes introduce several complex queries with window functions, CTEs, and joins that could have significant performance impacts as the XP data grows.

## Key Performance Concerns

### 1. **ROW_NUMBER() Window Function Performance** ⚠️ **HIGH PRIORITY**

**Issue**: All queries use `ROW_NUMBER() OVER (ORDER BY ...)` which requires sorting the entire result set before applying pagination.

```sql
(ROW_NUMBER() OVER (ORDER BY coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) DESC, id ASC))::int as rank
```

**Impact**: 
- For N users, this requires O(N log N) sorting operation
- Cannot benefit from LIMIT optimization
- Memory usage scales with table size
- Performance degrades significantly as user count grows

**Expected Query Plan**:
```
WindowAgg (cost=high rows=N width=X)
  -> Sort (cost=very_high rows=N width=X)
       Sort Key: (COALESCE(...)) DESC, id
       -> Seq Scan on Users (cost=0.00..X rows=N width=X)
```

### 2. **COUNT Query Performance** ⚠️ **HIGH PRIORITY**

**Issue**: The pagination count query wraps the entire ranking CTE, forcing full computation.

```sql
SELECT COUNT(*) FROM (
    with full_ranking as (
        -- Complex ranking logic with ROW_NUMBER()
    )
    select * from full_ranking
) as count_table;
```

**Impact**:
- Executes the expensive ranking calculation just to count rows
- Doubles the computational cost for paginated requests
- No opportunity for query optimization

### 3. **Quest-Specific Queries** ⚠️ **MEDIUM PRIORITY**

**Issue**: Multiple joins and aggregations in quest-specific leaderboard queries.

```sql
from "XpLogs" l
join "QuestActionMetas" m on l.action_meta_id = m.id
join "Quests" q on m.quest_id = q.id
join "Users" u on l.user_id = u.id 
```

**Potential Issues**:
- Join performance depends on index availability
- GROUP BY operations on large XpLogs table
- FULL OUTER JOIN in ranked_users CTE

### 4. **Search Functionality** ⚠️ **MEDIUM PRIORITY**

**Issue**: JSONB field search with LOWER() function.

```sql
LOWER(U.profile->>'name') LIKE LOWER('%search%')
```

**Impact**:
- Cannot use indexes effectively due to function call
- JSONB extraction adds overhead
- Pattern matching with leading wildcard prevents index usage

## Recommended Query Plans (Expected)

### Query 1: General Leaderboard
```
QUERY PLAN
├── Limit (cost=high)
│   └── Sort (cost=very_high rows=all_users)
│       └── WindowAgg (cost=high)
│           └── Sort (cost=very_high)
│               └── Seq Scan on Users (cost=moderate)
```

**Estimated Performance**: 
- Small datasets (< 10K users): 50-200ms
- Medium datasets (10K-100K users): 500ms-2s
- Large datasets (> 100K users): 2s-10s+

### Query 2: Count Query
```
QUERY PLAN
├── Aggregate (cost=moderate)
│   └── WindowAgg (cost=high)
│       └── Sort (cost=very_high)
│           └── Seq Scan on Users (cost=moderate)
```

### Query 3: Quest-Specific Leaderboard
```
QUERY PLAN
├── WindowAgg (cost=high)
│   └── Hash Join (cost=moderate)
│       ├── Hash (cost=moderate)
│       │   └── Hash Full Join (cost=high)
│       │       ├── HashAggregate (cost=high)
│       │       │   └── Hash Join (cost=high)
│       │       │       └── [Multiple joins on XpLogs, QuestActionMetas, Quests, Users]
│       │       └── [Similar structure for creator branch]
│       └── Seq Scan on Users
```

## Performance Optimization Recommendations

### 1. **Immediate Optimizations** 🔥

#### A. Add Critical Indexes
```sql
-- Primary performance indexes
CREATE INDEX CONCURRENTLY idx_users_xp_points_desc_id_asc 
ON "Users" ((coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0)) DESC, id ASC) 
WHERE tier != 0;

-- For quest-specific queries
CREATE INDEX CONCURRENTLY idx_xplogs_quest_user 
ON "XpLogs" (action_meta_id, user_id) 
INCLUDE (xp_points);

CREATE INDEX CONCURRENTLY idx_xplogs_quest_creator 
ON "XpLogs" (action_meta_id, creator_user_id) 
INCLUDE (creator_xp_points);

-- For search functionality
CREATE INDEX CONCURRENTLY idx_users_profile_name_gin 
ON "Users" USING gin ((profile->>'name') gin_trgm_ops) 
WHERE tier != 0;
```

#### B. Optimize Count Queries
Replace expensive count with cached/approximated counts:

```sql
-- Option 1: Use table statistics for approximate count
SELECT reltuples::bigint as approximate_count 
FROM pg_class 
WHERE relname = 'Users';

-- Option 2: Maintain a cached count in a separate table
CREATE TABLE leaderboard_stats (
    query_type varchar(50),
    quest_id int,
    search_term varchar(255),
    user_count int,
    last_updated timestamp
);
```

### 2. **Architecture Improvements** 📈

#### A. Implement Leaderboard Materialized Views
```sql
-- Create materialized view for general leaderboard
CREATE MATERIALIZED VIEW mv_user_leaderboard AS
SELECT 
    id as user_id,
    coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) as total_xp,
    tier,
    profile->>'name' as user_name,
    profile->>'avatar_url' as avatar_url,
    ROW_NUMBER() OVER (ORDER BY coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) DESC, id ASC) as rank
FROM "Users"
WHERE tier != 0;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX idx_mv_user_leaderboard_rank ON mv_user_leaderboard (rank);
CREATE INDEX idx_mv_user_leaderboard_user_id ON mv_user_leaderboard (user_id);

-- Refresh strategy (run periodically)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_leaderboard;
```

#### B. Quest-Specific Materialized Views
```sql
CREATE MATERIALIZED VIEW mv_quest_leaderboards AS
SELECT 
    quest_id,
    user_id,
    total_xp,
    ROW_NUMBER() OVER (PARTITION BY quest_id ORDER BY total_xp DESC, user_id ASC) as rank
FROM (
    -- Aggregated quest XP logic here
) quest_totals;
```

### 3. **Application-Level Optimizations** ⚡

#### A. Implement Cursor-Based Pagination
Instead of OFFSET/LIMIT, use cursor-based pagination:

```sql
-- Instead of OFFSET 100 LIMIT 50
SELECT * FROM mv_user_leaderboard 
WHERE rank > 100 
ORDER BY rank 
LIMIT 50;
```

#### B. Cache Frequently Accessed Data
- Cache top 100 users in Redis
- Cache user-specific ranks for active users
- Implement cache invalidation strategy

#### C. Background Processing
- Update leaderboards asynchronously
- Use job queues for expensive operations
- Implement incremental updates

### 4. **Monitoring and Alerting** 📊

#### A. Query Performance Monitoring
```sql
-- Monitor slow queries
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements 
WHERE query ILIKE '%full_ranking%'
ORDER BY mean_exec_time DESC;
```

#### B. Set Performance Thresholds
- Alert if leaderboard queries exceed 1 second
- Monitor memory usage during window function operations
- Track index usage and effectiveness

## Risk Assessment

### High Risk ⚠️
1. **Scalability**: Current approach doesn't scale beyond ~50K active users
2. **Resource Usage**: High memory consumption during peak usage
3. **User Experience**: Potential timeouts on large datasets

### Medium Risk ⚠️
1. **Database Load**: Expensive queries during peak hours
2. **Cache Invalidation**: Complex invalidation logic needed
3. **Data Consistency**: Race conditions during concurrent updates

### Low Risk ✅
1. **Correctness**: Queries produce accurate results
2. **Functionality**: All required features implemented

## Implementation Timeline

### Phase 1 (Immediate - Before Merge)
- [ ] Add critical indexes
- [ ] Implement query timeout protection
- [ ] Add performance monitoring

### Phase 2 (Short-term - 1-2 weeks)
- [ ] Implement materialized views
- [ ] Add caching layer
- [ ] Optimize count queries

### Phase 3 (Medium-term - 1 month)
- [ ] Implement cursor-based pagination
- [ ] Add background processing
- [ ] Performance testing with realistic data volumes

## Conclusion

The PR introduces significant functionality but with performance concerns that must be addressed before production deployment. The primary issues are:

1. **Window functions requiring full table sorts**
2. **Expensive count queries**
3. **Missing critical indexes**

**Recommendation**: Implement Phase 1 optimizations before merging, and plan Phase 2 improvements for the next sprint.

---

*This analysis should be validated with actual query plans once the database is available with realistic data volumes.*