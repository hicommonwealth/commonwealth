import { CommonApiClient } from './sdks/typescript';

async function main() {
  const myAddress = '0x2cE1F5d4f84B583Ab320cAc0948AddE52a131FBE';

  const client = new CommonApiClient({
    apiKey: 'JytqBjYXafFIS7XnMJlpcEnlNImagtEi_LC8Mq7SLCQ',
    address: myAddress,
  });

  const communityId = 'tim-test-api-1';

  const community = await client.community.createCommunity(
    {
      id: communityId,
      name: 'Tim Test External API 1',
      chainNodeId: 37,
      base: 'ethereum',
      userAddress: myAddress,
      defaultSymbol: 'TIM',
    },
    { maxRetries: 0 },
  );
  console.log(`Community created: ${community.community.id}`);

  const topic = await client.community.createTopic(
    {
      communityId,
      name: 'Externally Created Topic',
    },
    { maxRetries: 0 },
  );
  console.log(`Topic created: ${topic.topic.id}`);

  const thread = await client.thread.createThread(
    {
      communityId,
      topicId: topic.topic.id!,
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
  console.log(`Thread created: ${thread.id}`);
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
