# Monitoring
### Production
- To monitor the state of chain-event listeners, events received, and server metrics visit the [Chain-Events Datadog dashboard][1].
- To view logs check the [Datadog logstream][5]
### Staging
[WIP] Improvements coming soon
- View Heroku logs

# Scaling
## Number of Dynos
### App or ChainEventsConsumer
Scale like normal using Heroku sliders.
### ChainSubscriber
1. Update the `NUM_CHAIN_SUBSCRIBERS` env var to the number of desired dynos.
2. Add the number of desired dynos to the Procfile. Ensure that `CHAIN_SUBSCRIBER_INDEX` is set for every dyno (see [here][7]).

## Dyno Size
Scaling the dyno size requires no secondary actions. That is all you need to do is change the dyno size on Heroku. Note that the Node memory option [max-old-space-size][6] which controls the size of the available Node heap is set automatically relative to the size of the dyno. This is thanks to the get-memory-size-limit.sh script which retrieves the dynos maximum available RAM and adjusts the memory limit accordingly.

#### Note on the memory script
By default the script gives Node 85% of the total dyno RAM. This percentage can be adjusted directly from the Procfile via the 'multiplier'. For example,
`node --max_old_space_size=$(../../../../scripts/get-max-old-space-size.sh 1.1)`, this code has a multiplier of 1.1 which multiplied to the default 85% would mean (1.1 * 85) = 93.5% of the total dyno RAM is used.

If the script fails at any point it returns a default memory limit of 1.5GB (a middle ground between all existing dyno sizes). If the script fails to run at all Node will utilize the 4GB default value. Node will still successfully start with these memory limits but it may be less efficient. When executed locally the script will return 4GB.

# Scripts

# Docker

# Speeding up chain discovery time

# Linking CE to a new CW instance
To link a new or existing chain-events service to a new commonwealth service follow these steps:
1. Put the chain-events service in maintenance mode and turn off all dynos.
2. Set the environment variables as described in [Environment Variables][2].
3. Ensure the `ENTITIES_URL` env var does not exist in the commonwealth service that is being disconnected (if any).
4. Update the `CLOUDAMQP_APIKEY` and `CLOUDAMQP_URL` environment variables in both the chain-events service and the disconnected commonwealth service.
5. Clear the old RabbitMQ instance of all queues and exchanges.
6. If this process took more than 30 minutes run the migrateEvents script as described [here][3].
7. Run the enforceDataConsistency script as described [here][4].
8. Turn on the chain-event dynos and take the app out of maintenance mode.
















[1]: https://us5.datadoghq.com/dashboard/yjx-n4h-z6a/chain-events?
[2]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events%20Environment%20Variables
[3]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events%20Overview#migrating-eventsentities
[4]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Overview#enforcing-chain-event-data-consistency
[5]: https://us5.datadoghq.com/logs?query=-service%3A%28cmn_staging%20OR%20cmn_prod%20OR%20commonbot-ui%20OR%20commonbot%20OR%20commonbot-ui-staging%29&cols=host%2Cservice&index=%2A&messageDisplay=inline&stream_sort=time%2Cdesc&viz=stream&from_ts=1674383847840&to_ts=1674384747840&live=true
[6]: https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes
[7]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Events-Environment-Variables#heroku