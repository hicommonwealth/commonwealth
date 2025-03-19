import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import axios from 'axios';
import { BASE_API_PATH } from 'utils/trpcClient';

export const distributeSkale = async (
  walletAccount: string,
  chainId?: string,
) => {
  if (chainId && parseInt(chainId) === cp.ValidChains.SKALE_TEST) {
    const payload = {
      '0': {
        address: walletAccount,
        eth_chain_id: parseInt(chainId!),
      },
    };

    const response = await axios.post(
      // eslint-disable-next-line max-len
      `${BASE_API_PATH}/user.distributeSkale?batch=1`,
      payload,
    );
    if (response.status !== 200) {
      throw new Error(
        `Request failed with status ${response.status}: ${response.statusText}`,
      );
    }
  }
};
