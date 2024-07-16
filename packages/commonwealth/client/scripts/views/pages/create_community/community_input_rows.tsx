import axios from 'axios';
import { userStore } from 'state/ui/user';

import app from 'state';

export async function updateAdminOnCreateCommunity(communityId: string) {
  userStore.getState().setData({
    activeAccount: userStore
      .getState()
      .addresses.filter((a) => a.community.id === communityId)[0],
  });

  const roles = await axios.get(`${app.serverUrl()}/roles`, {
    params: {
      chain_id: communityId,
      permissions: ['admin'],
    },
  });

  app.roles.addRole(roles.data.result[0]);
  app.skipDeinitChain = true;
}
