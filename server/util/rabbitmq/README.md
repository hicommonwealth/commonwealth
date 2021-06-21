# Notice:
Use the Readme in the rabbitmq folder in the chain-events repo to learn how to setup rabbitmq
in order to use the consumer here.

# Change List:
1. Created a consumer class in `consumer.ts` that ingests messages from a queue in rabbitmq
2. Instantiated the consumer in `setupChainEventListeners.ts`
3. Removed all the subscribers from `setupChainEventListeners.ts`
4. Instantiated the handlers and passed them to the consumer to process events as they arrive
