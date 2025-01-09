import { ServerError } from '@hicommonwealth/core';
import { createPrivateEvmClient } from '@hicommonwealth/evm-protocols';
import { config } from '../../config';

/**
 * A helper for creating the web3 provider via an RPC, including private key import
 * @param rpc the rpc of the network to use helper with
 * @param keyOverride An optional private key override
 * @returns
 */

export const createWeb3Provider = (
  rpc: string,
  keyOverride?: string,
): ReturnType<typeof createPrivateEvmClient> => {
  if (!keyOverride && !config.WEB3.PRIVATE_KEY)
    throw new ServerError('WEB3 private key not set!');

  return createPrivateEvmClient({
    rpc,
    privateKey: keyOverride || config.WEB3.PRIVATE_KEY,
  });
};
