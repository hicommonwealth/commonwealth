# Query Optimization

## Limit columns and data pulled by Sequelize
`/viewSubscriptions`.   
https://github.com/hicommonwealth/commonwealth/issues/3429#issuecomment-1552327071

## Frequent queries
- Potential Caching Opportunity 
  - if stale data is fine, decide on TTL & cache 
  Eg. /viewGlobalActivity

## Slow Deletes
- Refactor foreign key constraints to prevent slow cascade delete
https://github.com/hicommonwealth/commonwealth/issues/3437

## Slow Reads
- JSONB attributes if used in where clause can result in slow reads, if JSONB attribute required for querying store it as separate column
https://stackoverflow.com/questions/71086258/query-on-json-jsonb-column-super-slow-can-i-use-an-index

## Slow Inserts
- Calculating max everytime making new entry
https://github.com/hicommonwealth/commonwealth/issues/3438