import Web3 from 'web3';
import { PROVIDER_URL } from '../../config';

const getProvider = () => {
  return new Web3(new Web3.providers.HttpProvider(String(PROVIDER_URL)));
};

export default getProvider;
