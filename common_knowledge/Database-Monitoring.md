# Database Monitoring

_See also the [Datadog](./Datadog.md) and [Heroku](./Heroku.md) entries._

## Contents

- [Heroku Database Monitoring](#heroku-database-monitoring)
- [Schema Inspection](#schema-inspection)
- [Local Database Monitoring](#local-database-monitoring)
  * [PGAdmin4](#pgadmin4)
  * [Helper Queries](#helper-queries)
- [Change Log](#change-log)

## Heroku Database Monitoring

To connect to the PSQL schema, use the following command:

```bash
heroku pg:psql postgresql-clear-46785 -a commonwealth-staging
```

As of 240711, the current database being used is Postgres 15.7. Major versions will not progress without a manual update, but minor versions may be updated automatically by Heroku.

You can retrieve general information and uptime using the following SQL queries:

General Info:

```SQL
SELECT current_database(), current_user, inet_server_addr(), inet_server_port(), version()
```

Uptime:

```SQL
SELECT extract(epoch from current_timestamp - pg_postmaster_start_time()) as uptime
```

## Schema Inspection

To inspect the definition of a particular object in the schema, use the following command:

```SQL
\d "Subscriptions"
```

To view all foreign keys in the schema, use the following query:

```SQL
SELECT conrelid::regclass
AS table_name, conname
AS foreign_key, pg_get_constraintdef(oid)  
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype DESC;
```

To view all indexes in the schema, use the following query:

```SQL
SELECT tablename, indexname, indexdef 
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Local Database Monitoring

### PGAdmin4

You can use PGAdmin4 for local database monitoring. It provides various features and visualizations for monitoring your Postgres database. Some of the functionalities include:

- Database statistics and deadlocks overview
- Table statistics, including the number of rows, disk usage, and more
- Dashboard based on `pg_activity`, which provides an overview of current database activity

### Helper Queries

Major tables:

```SQL
-- Current database activity
SELECT * FROM pg_stat_activity;

-- PG statements stats
SELECT * FROM pg_stat_statements;

-- Locks table
SELECT * FROM pg_locks;

-- Table stats
SELECT * 
FROM pg_stat_all_tables 
WHERE schemaname = 'public';
```

Queries using the tables above:

```SQL
-- Top 10 queries by total execution time
SELECT mean_exec_time, calls, total_exec_time, rows, 100.0 * shared_blks_hit /
               nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent, query
FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Top 10 queries by mean execution time
SELECT mean_exec_time, calls, total_exec_time, rows, 100.0 * shared_blks_hit /
               nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent, query
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Queries running for more than 5 minutes
SELECT
  pid,
  user,
 @@ -125,7 +118,7 @@ SELECT
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Blocked queries
SELECT
    activity.pid,
    activity.usename,
 @@ -135,33 +128,32 @@ SELECT
FROM pg_stat_activity AS activity
JOIN pg_stat_activity AS blocking ON blocking.pid = ANY(pg_blocking_pids(activity.pid));

-- View locks with table name and queries
SELECT 
    relname AS relation_name, 
    query, 
    pg_locks.* 
FROM pg_locks
JOIN pg_class ON pg_locks.relation = pg_class.oid
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid;

-- Tables with the most activity
SELECT schemaname, relname, seq_scan, idx_scan
FROM pg_stat_all_tables 
WHERE schemaname = 'public'
ORDER BY coalesce(seq_scan, 0) + coalesce(idx_scan, 0) DESC 
LIMIT 5;

-- Tables missing index fetch
SELECT relid, schemaname, relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_all_tables 
WHERE schemaname = 'public'
AND idx_tup_fetch = 0
ORDER BY seq_tup_read DESC;

-- Number of connections per database
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Lock mode and count
SELECT mode, COUNT(mode) FROM pg_locks GROUP BY mode ORDER BY mode;
```

## Change Log

- 240702: Outdated Datadog information removed by Graham Johnson
- 230627: Updated and certified fresh by Nakul Manchanda.
- 230413: Authored by Nakul Manchanda.
