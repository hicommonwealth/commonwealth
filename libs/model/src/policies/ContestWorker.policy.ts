import { events, Policy } from '@hicommonwealth/core';
import { getThreadUrl } from '@hicommonwealth/shared';
import { URL } from 'url';
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
                as: 'contest_managers',
              },
            ],
          },
        );
        const chainNodeUrl = community!.ChainNode!.private_url!;

        const web3Client = await ContestHelper.createWeb3Provider(
          chainNodeUrl,
          process.env.PRIVATE_KEY!,
        );

        const fullContentUrl = getThreadUrl({
          chain: community!.id!,
          id: payload.id,
          title: payload.title,
        });

        // content url only contains path
        const contentUrl = new URL(fullContentUrl).pathname;

        const contestAddress = community!.contest_managers![0].contest_address;
        const { address: userAddress } = (await models.Address.findByPk(
          payload!.address_id,
        ))!;
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
                as: 'contest_managers',
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
