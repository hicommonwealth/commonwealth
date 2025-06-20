import * as schemas from '@hicommonwealth/schemas';
import axios from 'axios';
import { BASE_API_PATH } from 'utils/trpcClient';
import { z } from 'zod/v4';

type Status = z.infer<(typeof schemas.GetStatus)['output']>;

export const fetchStatus = async (): Promise<Status | undefined> => {
  const { data } = await axios.get(`${BASE_API_PATH}/user.getStatus`);
  return data?.result?.data;
};
