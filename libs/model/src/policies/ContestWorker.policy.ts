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
        });
        // content url only contains path
        const contentUrl = new URL(fullContentUrl).pathname;

        for (const contestManager of community!.contest_managers!) {
          const { address: userAddress } = (await models.Address.findByPk(
            payload!.address_id,
          ))!;
          await contestHelper.addContent(
            chainNodeUrl!,
            contestManager.contest_address!,
            userAddress,
            contentUrl,
          );
        }
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

        const fullContentUrl = getThreadUrl({
          chain: community!.id!,
          id: payload.thread_id!,
        });
        const contentUrl = new URL(fullContentUrl).pathname;
        for (const contestManager of community!.contest_managers!) {
          const contestAddress = contestManager.contest_address;
          console.log({ contestAddress, contentUrl, action: 'added' });
          const addAction = await models.ContestAction.findOne({
            where: {
              contest_address: contestAddress,
              content_url: contentUrl,
              action: 'added',
            },
          });
          const userAddress = addAction!.actor_address!;
          const contentId = addAction!.content_id!;
          await contestHelper.voteContent(
            chainNodeUrl!,
            contestAddress,
            userAddress,
            contentId.toString(),
          );
        }
      },
    },
  };
}
