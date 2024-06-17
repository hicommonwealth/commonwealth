import Web3 from 'web3';
import { config } from '../config';

const getProvider = () => {
  return new Web3(
    new Web3.providers.HttpProvider(String(config.EVM.PROVIDER_URL)),
  );
};

export default getProvider;
