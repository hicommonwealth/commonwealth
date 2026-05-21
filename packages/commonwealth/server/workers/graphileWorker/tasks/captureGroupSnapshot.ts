import { command, logger } from '@hicommonwealth/core';
import { GroupSnapshot } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { systemActor } from '@hicommonwealth/model/middleware';
import { TaskPayloads } from '@hicommonwealth/model/services';

const log = logger(import.meta);

export const captureGroupSnapshotTask = {
  input: TaskPayloads.CaptureGroupSnapshot,
  fn: captureGroupSnapshot,
};

export async function captureGroupSnapshot(payload: { groupId: number }) {
  const { groupId } = payload;

  log.info('Starting group snapshot capture', { groupId });

  try {
    const group = await models.Group.findByPk(groupId, {
      attributes: ['community_id'],
    });

    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    await command(GroupSnapshot.CreateGroupSnapshot(), {
      actor: systemActor({}),
      payload: {
        community_id: group.community_id,
        group_id: groupId,
      },
    });

    log.info('Group snapshot captured', { groupId });
  } catch (error) {
    log.error('Failed to capture group snapshot', error as Error, {
      groupId,
    });
    throw error;
  }
}
