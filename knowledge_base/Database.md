## Heroku

## Current Data Plans & Tiers

**Heroku Database plans**
<https://devcenter.heroku.com/articles/heroku-postgres-plans>

**Our Current Plan**
<https://data.heroku.com/>.  
<img width="800" alt="image" src="https://user-images.githubusercontent.com/4791635/229220173-867abd05-ba40-456a-93a5-3e910e4ffe2b.png">

### Scenario: Add follower DB

- provision new database using `heroku addons:create` use `--follow` flag to indicate master & specify target environment for new database using `-a`
- Database provisioning will take 3-5 minutes and additional 10-15 minutes to catch up to master

```bash
# find `Add on` name of DATABASE_URL - using pg:info on prod app
heroku pg:info -a commonwealthapp

# provision & marks it master with --follow, using `Add on` property from previous command
heroku addons:create heroku-postgresql:standard-0 --follow postgresql-clear-46785 -a commonwealth-beta

# confirm new color name of database provisioned in previous command eg - HEROKU_POSTGRESQL_MAROON_URL
heroku config:set CW_READ_DB $(heroku config:get HEROKU_POSTGRESQL_MAROON_URL -a commonwealth-beta)

# check status of follower - `Behind By:` info from the following command output
heroku pg:info -a commonwealth-beta
```

## Scenario: Change DB Plan Heroku
<https://devcenter.heroku.com/articles/updating-heroku-postgres-databases>
Need small maintenance downtime

## Scenario: Destroy / Delete a Database
<https://devcenter.heroku.com/articles/heroku-postgresql#removing-the-add-on>
<img width="771" alt="image" src="https://user-images.githubusercontent.com/4791635/229538904-f4a1f169-453f-4c64-8ff1-231d480ebacf.png">

## Backups & Schedule
<https://devcenter.heroku.com/articles/heroku-postgres-backups>

## HEROKU DATADOG DATABASE MONITORING HEROKU GUIDE
<https://docs.datadoghq.com/database_monitoring/guide/heroku-postgres/#pagetitle>

## HEROKU BUILD AGENT CONF VARIABLES
<https://docs.datadoghq.com/agent/basic_agent_usage/heroku/#configuration>

## Change Log

- 230331: Authored by Nakul Manchanda.
- 230516: Updated by Nakul Manchanda.
