import { schemas, type Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/model';

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
      const { threadId, userAddress, chainNodeUrl } = payload;

      const contestAddress = '0x123'; // TODO: get contest address from contest metadata projection
      const contentUrl = `https://`; // TODO: generate content URL programmatically?

      const web3Client = await commonProtocol.contestHelper.createWeb3Provider(
        chainNodeUrl,
        process.env.PRIVATE_KEY!,
      );

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
      const { threadId, userAddress, chainNodeUrl } = payload;

      const contestAddress = '0x123'; // TODO: get contest address from contest metadata projection
      const contentId = '111'; // TODO: get content ID saved from ThreadCreated

      const web3Client = await commonProtocol.contestHelper.createWeb3Provider(
        chainNodeUrl,
        process.env.PRIVATE_KEY!,
      );

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
