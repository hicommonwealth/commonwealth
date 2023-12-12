import Web3 from 'web3';

export const providerUrl = 'http://chain:8545';
const getProvider = () => {
  if (process.env.RPC_HOST === 'ganache') {
    return new Web3(new Web3.providers.HttpProvider(providerUrl));
  }
  return new Web3(
    new Web3.providers.HttpProvider(String(process.env.RPC_HOST))
  );
};

export default getProvider;
