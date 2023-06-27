## PSQL Schema Inspection

### How to connect
```bash
heroku pg:psql postgresql-clear-46785 -a commonwealth-staging
```

### About DB
We are currently using Postgres 13.10
```SQL
-- general info
SELECT current_database(), current_user, inet_server_addr(), inet_server_port(), version()

-- uptime
select extract(epoch from current_timestamp - pg_postmaster_start_time()) as uptime
```

### Schema
```
-- schema definition of particular object
\d "Subscriptions"

-- all foreign keys
SELECT conrelid::regclass AS table_name,  
conname AS foreign_key, 
pg_get_constraintdef(oid)  
FROM   pg_constraint                                                                                                                                                                                        WHERE  contype = 'f'                                                                                                                                                                                        AND    connamespace = 'public'::regnamespace                                                                                                                                                                
ORDER  BY conrelid::regclass::text, contype DESC;

-- all indexes
SELECT tablename,indexname,indexdef 
FROM pg_indexes
WHERE schemaname = 'public'                                                                                                                                                                                   ORDER BY tablename,indexname;
```




## Setup Datadog-Heroku Postgres Monitoring 
[Heroku Postgres Datadog Setup Guide](https://docs.datadoghq.com/database_monitoring/guide/heroku-postgres/#pagetitle)
 - Added new Datadog folder - with postgres config `datadog/conf.d/postgres.yaml` and `prerun.sh` to grab right credentials for Datadog at runtime.
- Helper script to complete the setup from local machine logged into Heroku via cli.  
  It creates new Datadog user credentials for DATABASE_URL & also create new DATADOG schema in postgres to collect metrics

```bash
# yarn datadog-db-setup <app-name>
yarn --packages/commonwealth datadog-db-setup commonwealth-staging packages/commonwealth/datadog
```

## Datadog Postgres Dashboards
[Postgres Metrics Dashboard](https://us5.datadoghq.com/dash/integration/150/postgres---metrics)
<img width="1429" alt="image" src="https://user-images.githubusercontent.com/4791635/231848762-461e4a24-845c-4cc8-bf41-54a9fc8c1687.png">

[Postgres Overview](https://us5.datadoghq.com/dash/integration/149/postgres---overview)
- TODO: No data in - Resource Utilization, Locks, Throughput, Replication, Checkpoints, Logs
<img width="1429" alt="image" src="https://user-images.githubusercontent.com/4791635/231849089-4ff8e39c-af59-4363-83b5-d6fe1f0fb23f.png">


## Local Database Monitoring

### [PGAdmin4](https://www.pgadmin.org/docs/pgadmin4/development/tabbed_browser.html)


- DB Stats & Deadlocks etc
<img width="1188" alt="image" src="https://user-images.githubusercontent.com/4791635/231845127-67082082-04c3-4dc6-8013-c1e9e4191e47.png">

- Table Stats
https://dba.stackexchange.com/a/193239
<img width="1430" alt="image" src="https://user-images.githubusercontent.com/4791635/231845241-03319fef-ee70-4af6-ad46-3b17e5a651f0.png">

- Dashboard - based of pg_activity
<img width="1430" alt="image" src="https://user-images.githubusercontent.com/4791635/231845393-9a077eb2-7cd0-45a7-bb7f-e3321fa3086c.png">


## Helper Queries

https://www.postgresql.org/docs/current/monitoring-stats.html

### Major Tables

```SQL
-- current database activity
select * from pg_stat_activity

-- pg statements stats
select * from FROM pg_stat_statements

-- locks table
SELECT * FROM pg_locks

-- table stats
select * 
from pg_stat_all_tables 
where schemaname='public'

```

### Queries - Using tables above

```
-- Top 10 by total_exec_time
SELECT mean_exec_time, calls, total_exec_time, rows, 100.0 * shared_blks_hit /
               nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent, query
          FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Top 10 by mean exec time
SELECT mean_exec_time, calls, total_exec_time, rows, 100.0 * shared_blks_hit /
               nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent, query
          FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

--query running for more than 5minutes
SELECT
  pid,
  user,
  pg_stat_activity.query_start,
  now() - pg_stat_activity.query_start AS query_time,
  query,
  state,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

--blocked
SELECT
    activity.pid,
    activity.usename,
    activity.query,
    blocking.pid AS blocking_id,
    blocking.query AS blocking_query
FROM pg_stat_activity AS activity
JOIN pg_stat_activity AS blocking ON blocking.pid = ANY(pg_blocking_pids(activity.pid));

--view locks with table name & queries
select 
    relname as relation_name, 
    query, 
    pg_locks.* 
from pg_locks
join pg_class on pg_locks.relation = pg_class.oid
join pg_stat_activity on pg_locks.pid = pg_stat_activity.pid

--tables with most activity
select schemaname,relname,seq_scan,idx_scan
from pg_stat_all_tables 
where schemaname='public'
order by coalesce(seq_scan,0)+coalesce(idx_scan,0) desc 
limit 5;

-- tables missing idx fetch
select relid, schemaname, relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
from pg_stat_all_tables 
where schemaname='public'
and  idx_tup_fetch=0
order by seq_tup_read DESC

-- 
select datname, count(*) from pg_stat_activity group by datname;

-- 
SELECT mode,COUNT(mode) FROM pg_locks GROUP BY mode ORDER BY mode;
```

