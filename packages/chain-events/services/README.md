# Chains-events Microservice
## Design
![](Chain_Events_Service.drawio.png)

## Explanation
### ChainEventsSubscriber
- This server subscribes to a subset of chains in order to capture chain-events which it subsequently
formats and enriches. Once the chain-event is properly formatted, it is published to the ChainEvents Exchange
using the RabbitMQHandler.
### ChainEventsConsumer
- This server initializes an instance of the ServiceConsumer. The ServiceConsumer is passed
a single processor function for each queue that it will subscribe to. For an example see: 
[ChainEventsQueueProcessor](ChainEventsConsumer/MessageProcessors/ChainEventsQueue.ts).
- The processor functions are passed as RabbitMQSubscription see: [RabbitMQSubscription](../../common-common/src/ServiceConsumer.ts)
- The ChainEventsConsumer publishes ChainEvent, ChainEventType, and ChainEntity CUD messages to the CUD Exchange
### Queues
For more information on RabbitMQ and the queues see the [README.md](../../common-common/src/rabbitmq/README.md)
- ChainEventsQueue
  - Receives formatted and enriched chain-events to be processed by the ChainEventsConsumer
- ChainCDChainEventsQueue
  - New chains and chainNodes created on the master service that the ChainEventsConsumer saves in the ChainEvents service
  database.
