# Service Tests
## Overview
These tests located in `packages/chain-events/test/integration/service-tests/**` are end-to-end tests for chain events. In order for the tests to run a local instance of a blockchain and an SDK must be running (see [Chain Testing][1]).

The tests are broken down as follows:
- Chain Base (e.g. EVM, Cosmos, Substrate)
  - Protocol (e.g. Aave, Compound, ERC20, ERC721)
    - Subscriber
      - Event Type
    - Consumer
      - Event Type
    - App
      - Event Type

### Subscriber Tests
Subscriber tests must start an instance of the [ChainEventsSubscriber][2]. Specifically, tests should start the subscriber using the `runSubscriberAsFunction` function which accepts an instance of the [MockRabbitMqHandler][4] and an object which defines the `chain` the subscriber should be listening to. Using this function is crucial as it allows the subscriber to listen to a local chain without using a live RabbitMQ instance or a live Commonwealth database instance.

### Consumer Tests
Consumer tests must start an instance of the [ChainEventsConsumer][5]. Specifically, tests should start the consumer directly using the `setupChainEventConsumer` function which accepts an instance of the [MockRabbitMqHandler][4]. Using this function is important as it bypasses the initialization of the actual RabbitMQController which would require a live RabbitMQ instance.

### App Tests
App tests must start an instance of the [ChainEventsApp][6]. Specifically, tests should start the app using the `createChainEventsApp` function.

### Mock RabbitMQ Controller
Each protocol test group utilizes the [MockRabbitMqController][3] to pass messages between the subscriber and consumer thus simulating a live RabbitMQ instance. The mock controller implements a simplified version of RabbitMQ routing. That is, in production, there exist error recovery strategies such as re-queueing and dead lettering that are not present in the mock controller. Thus if the consumer fails to process a message, the relevant test will immediately fail.

## Adding EVM Tests
To add EVM tests:
1. Identify the name of the protocol the tests are relevant to
2. Create a new file `packages/chain-events/test/integration/service-tests/EVM/[protocol-name].spec.ts`
3. Create 3 new "describe" test groups within the root level "describe" block (one for each of the CE services).
4. Utilize the exposed SDK to perform on-chain actions.

[1]: https://github.com/hicommonwealth/commonwealth/wiki/Chain-Testing-Overview
[2]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/ChainSubscriber/chainSubscriber.ts
[3]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/common-common/src/rabbitmq/mockRabbitMQController.ts
[4]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/ChainEventsConsumer/ChainEventHandlers/rabbitMQ.ts
[5]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/ChainEventsConsumer/chainEventsConsumer.ts
[6]: https://github.com/hicommonwealth/commonwealth/blob/master/packages/chain-events/services/app/Server.ts
