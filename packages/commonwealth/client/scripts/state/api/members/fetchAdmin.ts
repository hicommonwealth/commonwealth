import { AddressRole } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';

const ADMINS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchAdminProps {
  communityId: string;
  apiEnabled?: boolean;
}

// admins/mods are Address objects
const fetchAdmin = async ({ communityId }: FetchAdminProps) => {
  const memberAdmins: AddressRole[] = [];
  const memberMods: AddressRole[] = [];

  const res = await axios.get(`${SERVER_URL}${ApiEndpoints.FETCH_ADMIN}`, {
    params: {
      chain_id: communityId,
      permissions: ['moderator', 'admin'],
    },
  });
  const addresses = res.data.result || [];
  addresses.forEach((a) => {
    if (a.role === 'admin') {
      memberAdmins.push(a);
    } else if (a.role === 'moderator') {
      memberMods.push(a);
    }
  });
  return { admins: memberAdmins, mods: memberMods };
};

const useFetchAdminQuery = ({
  communityId,
  apiEnabled = true,
}: FetchAdminProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_ADMIN, communityId],
    queryFn: () => fetchAdmin({ communityId }),
    staleTime: ADMINS_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchAdminQuery;
