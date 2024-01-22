import { AccessLevel } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const CHANNELS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchAdminProps {
  chainId: string;
}

const fetchAdmin = async ({ chainId }: FetchAdminProps) => {
  const memberAdmins = [];
  const memberMods = [];

  try {
    const res = await axios.get(`${app.serverUrl()}/roles`, {
      params: {
        chain_id: chainId,
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
  } catch (err) {
    console.error(err);
  }
  return { admins: memberAdmins, mods: memberMods };
};

const useFetchAdminQuery = ({ chainId }: FetchAdminProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_ADMIN, chainId],
    queryFn: () => fetchAdmin({ chainId }),
    staleTime: CHANNELS_STALE_TIME,
  });
};

export default useFetchAdminQuery;
