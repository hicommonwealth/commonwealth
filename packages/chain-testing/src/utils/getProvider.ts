import Web3 from 'web3';
import Ganache from 'ganache';

const getProvider = () => {
  if (process.env.RPC_HOST === 'ganache') {
    return new Web3(new Web3.providers.HttpProvider('http://chain:8545'));
  }
  return new Web3(
    new Web3.providers.HttpProvider(String(process.env.RPC_HOST))
  );
};

export default getProvider;
