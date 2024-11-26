import { Projection, events } from '@hicommonwealth/core';
import { models, sequelize } from '../database';
import { mustExist } from '../middleware/guards';

const inputs = {
  SignUpFlowCompleted: events.SignUpFlowCompleted,
  CommunityCreated: events.CommunityCreated,
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
  CommentUpvoted: events.CommentUpvoted,
  //PollCreated: events.PollCreated,
  //ThreadEdited: events.ThreadEdited,
  //CommentEdited: events.CommentEdited,
  //PollEdited: events.PollEdited,
};

//  TODO: implement points formulas
const xpVals: Record<
  keyof typeof inputs,
  (user_id: number) => Promise<number>
> = {
  SignUpFlowCompleted: () => Promise.resolve(10),
  CommunityCreated: () => Promise.resolve(10),
  ThreadCreated: () => Promise.resolve(10),
  CommentCreated: () => Promise.resolve(10),
  CommentUpvoted: () => Promise.resolve(10),
};

async function getUserId(address_id: number) {
  const address = await models.Address.findOne({
    where: { id: address_id },
    attributes: ['user_id'],
  });
  mustExist('Address not found', address);
  return address.user_id!;
}

async function handleXp(
  event_name: keyof typeof inputs,
  ids: { user_id?: number; address_id?: number },
) {
  // TODO: check if action in valid quest

  const user_id = ids.user_id ?? (await getUserId(ids.address_id!));
  const xp_points = await xpVals[event_name](user_id);
  await sequelize.transaction(async (transaction) => {
    await models.XpLog.create(
      {
        user_id,
        event_name,
        xp_points,
        created_at: new Date(),
      },
      { transaction },
    );
    await models.User.increment(['xp_points'], {
      by: xp_points,
      where: { id: user_id },
      transaction,
    });
  });
}

export function Xp(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityCreated: async ({ payload }) => {
        await handleXp('CommunityCreated', {
          user_id: parseInt(payload.userId),
        });
      },
      SignUpFlowCompleted: async ({ payload }) => {
        await handleXp('SignUpFlowCompleted', { user_id: payload.user_id });
      },
      ThreadCreated: async ({ payload }) => {
        await handleXp('ThreadCreated', { address_id: payload.address_id });
      },
      CommentCreated: async ({ payload }) => {
        await handleXp('CommentCreated', { address_id: payload.address_id });
      },
      CommentUpvoted: async ({ payload }) => {
        await handleXp('CommentUpvoted', { address_id: payload.address_id });
      },
    },
  };
}
