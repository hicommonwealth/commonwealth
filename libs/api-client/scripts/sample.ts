import { CommonApiClient } from '../src';

async function main() {
  const myAddress = '0x2cE1F5d4f84B583Ab320cAc0948AddE52a131FBE';

  const client = new CommonApiClient({
    apiKey: 'JytqBjYXafFIS7XnMJlpcEnlNImagtEi_LC8Mq7SLCQ',
    address: myAddress,
  });

  const communityId = 'tim-test-api-2';

  // for (let x = 0; x < 20; ++x) {
  //   const community = await client.community.createCommunity(
  //     {
  //       id: `rate-limit-test-t4-${x}`,
  //       name: `rate-limit-test-t4-${x}`,
  //       chainNodeId: 37,
  //       base: 'ethereum',
  //       userAddress: myAddress,
  //       defaultSymbol: 'TIM',
  //     },
  //     { maxRetries: 0 },
  //   );
  //   console.log(`Community created: ${community.community.id}`);
  // }

  // for (let i = 0; i < 100; i++) {
  //   const topic = await client.community.createTopic(
  //     {
  //       communityId,
  //       name: `topic ${i}`,
  //     },
  //     { maxRetries: 0 },
  //   );
  //   console.log(`Topic created: ${i}`);
  // }

  for (let i = 0; i < 100; i++) {
    const thread = await client.thread.createThread(
      {
        communityId,
        topicId: 5181,
        title: 'Testing External API',
        body: `
      # Hi

      ~~strikethrough~~
    `,
        kind: 'discussion',
        stage: 'discussion',
        readOnly: false,
      },
      { maxRetries: 0 },
    );
    console.log(`Thread created: ${i}`);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      console.log('Finished');
    })
    .catch((err) => {
      console.log(err);
    });
}
