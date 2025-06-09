import { command } from '@hicommonwealth/core';
import { Community, GraphileTask, TaskPayloads } from '@hicommonwealth/model';

const indexCommunities = async () => {
  await command(Community.IndexCommunities(), {
    actor: {
      user: { id: 0, email: 'system@common.im' },
      address: '0x0',
      is_system_actor: true,
    },
    payload: {},
  });
};

export const indexCommunitiesTask: GraphileTask<
  typeof TaskPayloads.IndexCommunities
> = {
  input: TaskPayloads.IndexCommunities,
  fn: indexCommunities,
};
