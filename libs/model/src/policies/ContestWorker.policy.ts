import { events, Policy } from '@hicommonwealth/core';
import { getThreadUrl } from '@hicommonwealth/shared';
import { models } from '../database';
import { ContestHelper } from '../services/commonProtocol';

const inputs = {
  ThreadCreated: events.ThreadCreated,
  ThreadUpvoted: events.ThreadUpvoted,
};

export function ContestWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        const community = await models.Community.findByPk(
          payload.community_id,
          {
            include: [
              {
                model: models.ChainNode,
              },
              {
                model: models.ContestManager,
              },
              {
                model: models.Address,
              },
            ],
          },
        );
        const chainNodeUrl = community!.ChainNode!.private_url!;

        const web3Client = await ContestHelper.createWeb3Provider(
          chainNodeUrl,
          process.env.PRIVATE_KEY!,
        );

        const contentUrl = getThreadUrl({
          chain: community!.id!,
          id: payload.id,
          title: payload.title,
        });

        const contestAddress = community!.contest_managers![0].contest_address;
        const userAddress = payload.Address!.address;
        await ContestHelper.addContent(
          web3Client,
          contestAddress!,
          userAddress,
          contentUrl,
        );
      },
      ThreadUpvoted: async ({ payload }) => {
        const community = await models.Community.findByPk(
          payload.community_id,
          {
            include: [
              {
                model: models.ChainNode,
              },
              {
                model: models.ContestManager,
              },
              {
                model: models.Address,
              },
            ],
          },
        );
        const chainNodeUrl = community!.ChainNode!.private_url!;

        const web3Client = await ContestHelper.createWeb3Provider(
          chainNodeUrl!,
          process.env.PRIVATE_KEY!,
        );

        const contestAddress = community!.contest_managers![0].contest_address;

        const addAction = await models.ContestAction.findOne({
          where: {
            contest_address: contestAddress,
            action: 'added',
          },
        });
        const userAddress = addAction!.actor_address!;
        const contentId = addAction!.content_id!;
        await ContestHelper.voteContent(
          web3Client,
          contestAddress!,
          userAddress,
          contentId.toString(),
        );
      },
    },
  };
}
