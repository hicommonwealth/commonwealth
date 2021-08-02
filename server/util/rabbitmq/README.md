# Notice:
Use the Readme in the rabbitmq folder in the chain-events repo to learn how to set up rabbitmq
in order to use the consumer here.

# Getting Started:

### CW setup
- Run `yarn` to install all the dependencies

### Chain-Events Setup:
- Use `git clone https://github.com/timolegros/chain-events.git` to clone the chain-events repo into another directory
- Use `git checkout tim.rabbitmq` to switch to the branch with rabbitmq
- Run `yalc publish` to publish the package locally
- Navigate to the root of this project and run `yalc add @commonwealth/chain-events@0.6.5`
- Run `yarn build`
- Run `yarn start` and the app will automatically start reading events of the queue if there are any

# Change List:
1. Added `rascal` and `amqplib` to the dependencies in `package.json`
1. Created a consumer class in `consumer.ts` that ingests messages from a queue in rabbitmq
2. Instantiated the consumer in `setupChainEventListeners.ts`
3. Removed all the subscribers from `setupChainEventListeners.ts`
4. Instantiated the handlers and passed them to the consumer to process events as they arrive in `setupChainEventListeners.ts` and `consumer.ts`
5. Commented out storage fetchers/identity cache functionality since it depends on the subscribers that are no longer returned by `setupChainEventListners.ts`
