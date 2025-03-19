import { command } from '@hicommonwealth/core';
import { Community, GraphileTask, TaskPayloads } from '@hicommonwealth/model';
import { systemActor } from 'node_modules/@hicommonwealth/model/src/middleware';

const indexCommunities = async () => {
  await command(Community.IndexCommunities(), {
    actor: systemActor({}),
    payload: {},
  });
};

export const indexCommunitiesTask: GraphileTask<
  typeof TaskPayloads.IndexCommunities
> = {
  input: TaskPayloads.IndexCommunities,
  fn: indexCommunities,
};
