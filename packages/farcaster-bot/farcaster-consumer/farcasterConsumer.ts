import {
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import {
  RascalSubscriptions,
  TRmqMessages,
} from 'common-common/src/rabbitmq/types';
import { IFarcasterMessage } from 'common-common/src/types';
import { RABBITMQ_URI, SERVER_URL, CW_BOT_KEY } from '../utils/config';
import axios from 'axios';
import v8 from 'v8';
import { factory, formatFilename } from 'common-common/src/logging';
import { StatsDController } from 'common-common/src/statsd';
import {
  ServiceKey,
  startHealthCheckLoop,
} from 'common-common/src/scripts/startHealthCheckLoop';

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.FarcasterBotConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

const log = factory.getLogger(formatFilename(__filename));

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));

type BotThread = {
  title: string;
  address: string;
  author_chain: string;
  chain: string;
  body: string;
  stage: string;
  kind: string;
  auth: string;
};

type BotComment = {
  parentCommentId?: string;
  text: string;
  chain: string;
  author_chain: string;
  auth: string;
  address: string;
};

type ThreadCommentTree = {
  thread: BotThread;
  comments: Array<BotComment>;
};

async function buildThreadCommentTree(rootCasts: Array<any>) {
  const trees = [];

  for (const rootCast of rootCasts) {
    const threadCommentTree: ThreadCommentTree = {
      thread: {
        title: rootCast.body.data.title,
        address: '0xFarcasterBot',
        author_chain: 'logline',
        chain: 'logline',
        body: rootCast.body.data.text, // Add link here
        stage: 'discussion',
        kind: 'thread',
        auth: CW_BOT_KEY,
      },
      comments: [],
    };

    const queue = [
      {
        cast: rootCast,
        parentThreadId: null,
        parentCommentId: null,
        isThread: true,
      },
    ];

    // Using this BFS boilerplate so we can easily convert to a nested tree when we want to
    // Right now this could be accomplished with just a for loop
    while (queue.length > 0) {
      const { cast, parentThreadId, parentCommentId, isThread } = queue.shift();

      const title =
        cast.body.data.text.length > 50
          ? cast.body.data.text.slice(0, 50) + '...'
          : cast.body.data.text;

      const linkToWarpcast = `https://warpcast.com/${cast.body.username}/${cast.merkleRoot}`;

      if (isThread) {
        const payload = {
          title: encodeURIComponent(title),
          address: '0xfarcasterbot',
          author_chain: 'logline',
          chain: 'logline',
          body: encodeURIComponent(
            `[Go to Cast](${linkToWarpcast})` + '\n\n' + cast.body.data.text
          ), // Add link here
          stage: 'discussion',
          kind: 'discussion',
          auth: CW_BOT_KEY,
          bot_name: 'farcaster',
          topic_name: 'General',
          readOnly: false,
        };

        let threadId;
        // Make request to create thread
        try {
          const res = await axios.post(
            `${SERVER_URL}/api/bot/threads`,
            payload
          );
          threadId = res.data.result.id;
        } catch (e) {
          console.log(e);
        }

        try {
          const response = await axios.get(
            `https://searchcaster.xyz/api/search?merkleRoot=${cast.merkleRoot}`
          );

          for (const commentCast of response.data.casts) {
            if (!commentCast.body.data.replyParentMerkleRoot) {
              continue; // This is the thread root itself- no need to create a comment
            }

            queue.push({
              cast: commentCast,
              parentThreadId: threadId,
              parentCommentId: null,
              isThread: false,
            });
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        const payload = {
          address: '0xfarcasterbot',
          author_chain: 'logline',
          chain: 'logline',
          text: encodeURIComponent(cast.body.data.text), // Add link here
          stage: 'discussion',
          kind: 'discussion',
          auth: CW_BOT_KEY,
          bot_name: 'farcaster',
          parentCommentId: parentCommentId ?? null,
        };

        let commentId;

        try {
          const res = await axios.post(
            `${SERVER_URL}/api/bot/threads/${parentThreadId}/comments`,
            payload
          );
          commentId = res.data.result.id;
        } catch (e) {
          console.log(e);
        }

        // FOR NESTED COMMENTS, MAKE ANOTHER REQUEST AND PASS CHILDREN AS QUEUE ITEMS
      }
    }
  }
}

async function consumeMessages() {
  await controller.init();

  const processMessage = async (data: TRmqMessages) => {
    try {
      const parsedMessage = data as IFarcasterMessage;
      const threadCasts = new Set();

      const promises = parsedMessage.casts.map(async (cast) => {
        const parentMerkleRoot = cast.body.data.replyParentMerkleRoot;

        if (parentMerkleRoot) {
          const response = await axios.get(
            `https://searchcaster.xyz/api/search?merkleRoot=${parentMerkleRoot}`
          );
          // Get the cast which has no replyParentMerkeRoot- this is the thread root
          const threadRootCast = response.data.casts.find(
            (cast) => !cast.body.data.replyParentMerkleRoot
          );

          if (threadRootCast) threadCasts.add(JSON.stringify(threadRootCast));
        } else {
          threadCasts.add(JSON.stringify(cast));
        }
      });

      await Promise.all(promises);

      const uniqueRoots = [...threadCasts].map((item) =>
        JSON.parse(item as string)
      );

      console.log('uniqueRoots', uniqueRoots.length);
      await buildThreadCommentTree(uniqueRoots);
    } catch (error) {
      log.error(`Failed to process Message:`, error);
    }
  };
  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.FarcasterListener
  );

  isServiceHealthy = true;
}

consumeMessages();
