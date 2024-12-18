import { config } from '@hicommonwealth/model';
import Web3 from 'web3';

const getProvider = (): Web3 => {
  return new Web3(
    new Web3.providers.HttpProvider(String(config.TEST_EVM.PROVIDER_URL)),
  );
};

export default getProvider;
