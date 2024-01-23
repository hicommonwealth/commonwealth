import { AccessLevel } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const ADMINS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchAdminProps {
  communityId: string;
}

const fetchAdmin = async ({ communityId }: FetchAdminProps) => {
  const memberAdmins = [];
  const memberMods = [];

  const res = await axios.get(`${app.serverUrl()}/roles`, {
    params: {
      chain_id: communityId,
      permissions: ['moderator', 'admin'],
    },
  });
  const roles = res.data.result || [];
  roles.forEach((role) => {
    if (role.permission === AccessLevel.Admin) {
      memberAdmins.push(role);
    } else if (role.permission === AccessLevel.Moderator) {
      memberMods.push(role);
    }
  });
  return { admins: memberAdmins, mods: memberMods };
};

const useFetchAdminQuery = ({ communityId }: FetchAdminProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_ADMIN, communityId],
    queryFn: () => fetchAdmin({ communityId }),
    staleTime: ADMINS_STALE_TIME,
  });
};

export default useFetchAdminQuery;
