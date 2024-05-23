import { events, Policy } from '@hicommonwealth/core';
import { getThreadUrl } from '@hicommonwealth/shared';
import { URL } from 'url';
import { models } from '../database';
import { contestHelper } from '../services/commonProtocol';

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
                model: models.ChainNode.scope('withPrivateData'),
                required: false,
              },
              {
                model: models.ContestManager,
                as: 'contest_managers',
              },
            ],
          },
        );
        const chainNodeUrl =
          community?.ChainNode?.private_url || community?.ChainNode?.url;

        const fullContentUrl = getThreadUrl({
          chain: community!.id!,
          id: payload.id!,
          title: payload.title,
        });
        // content url only contains path
        const contentUrl = new URL(fullContentUrl).pathname;

        // TODO: refine contest manager selection?
        const contestAddress = community!.contest_managers![0].contest_address;
        const { address: userAddress } = (await models.Address.findByPk(
          payload!.address_id,
        ))!;
        await contestHelper.addContent(
          chainNodeUrl!,
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
                model: models.ChainNode.scope('withPrivateData'),
                required: false,
              },
              {
                model: models.ContestManager,
                as: 'contest_managers',
              },
            ],
          },
        );
        const chainNodeUrl =
          community?.ChainNode?.private_url || community?.ChainNode?.url;

        // TODO: refine contest manager selection?
        const contestAddress = community!.contest_managers![0].contest_address;
        const addAction = await models.ContestAction.findOne({
          where: {
            contest_address: contestAddress,
            action: 'added',
          },
        });

        const userAddress = addAction!.actor_address!;
        const contentId = addAction!.content_id!;
        await contestHelper.voteContent(
          chainNodeUrl!,
          contestAddress!,
          userAddress,
          contentId.toString(),
        );
      },
    },
  };
}
