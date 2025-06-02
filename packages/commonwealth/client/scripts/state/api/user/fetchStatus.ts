import * as schemas from '@hicommonwealth/schemas';
import axios from 'axios';
import { BASE_API_PATH } from 'utils/trpcClient';
import { z } from 'zod';

type Status = z.infer<(typeof schemas.GetStatus)['output']>;

export const fetchStatus = async (address: string): Promise<Status> => {
  const { data } = await axios.get(`${BASE_API_PATH}/user.getStatus`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      address,
    },
  });
  const status = data?.result?.data;
  return status;
};
