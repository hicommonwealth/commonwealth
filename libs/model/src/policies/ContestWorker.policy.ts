import { schemas, type Policy } from '@hicommonwealth/core';
import { commonProtocol, models } from '@hicommonwealth/model';

const inputs = {
  ThreadCreated: schemas.events.ThreadCreated,
  ThreadUpvoted: schemas.events.ThreadUpvoted,
  CommentCreated: schemas.events.CommentCreated,
};

export const ContestWorker: Policy<typeof inputs> = () => ({
  inputs,
  body: {
    ThreadCreated: async ({ name, payload }) => {
      console.log(name, payload);
      const { threadId, userAddress } = payload;

      const contestAddress = '0x123'; // TODO: get contest address from contest metadata projection
      const contentUrl = `https://`; // TODO: generate content URL programmatically?

      const web3Client = await createWeb3Client(threadId);

      const { contentId } = await commonProtocol.contestHelper.addContent(
        web3Client,
        contestAddress,
        userAddress,
        contentUrl,
      );

      // TODO: save content ID for later use in ThreadUpvoted event
    },
    ThreadUpvoted: async ({ name, payload }) => {
      console.log(name, payload);
      const { threadId, userAddress } = payload;

      const contestAddress = '0x123'; // TODO: get contest address from contest metadata projection
      const contentId = '111'; // TODO: get content ID saved from ThreadCreated

      const web3Client = await createWeb3Client(threadId);

      await commonProtocol.contestHelper.voteContent(
        web3Client,
        contestAddress,
        userAddress,
        contentId,
      );
    },
    CommentCreated: async ({ name, payload }) => {
      console.log(name, payload.comment);
    },
  },
});

const createWeb3Client = async (threadId: number) => {
  const thread = (
    await models.Thread.findByPk(threadId, {
      include: [
        {
          model: models.Community,
          as: 'Community',
          include: [
            {
              model: models.ChainNode,
              attributes: ['eth_chain_id', 'url'],
            },
            {
              model: models.CommunityStake,
            },
          ],
          attributes: ['namespace'],
        },
      ],
    })
  )?.toJSON();
  return commonProtocol.contestHelper.createWeb3Provider(
    thread!.Community!.ChainNode!.url,
  );
};
