import axios from 'axios';
import { AppError } from 'common-common/src/errors';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { ETHERSCAN_JS_API_KEY } from '../config';
import type { ContractAttributes } from '../models/contract';
import type { ContractAbiAttributes } from '../models/contract_abi';
import validateAbi from '../util/abiValidation';

export enum Network {
  Mainnet = 'Mainnet',
  Rinkeby = 'Rinkeby',
  Ropsten = 'Ropsten',
  Kovan = 'Kovan',
  Goerli = 'Goerli',
}

export const networkIdToName = {
  1: Network.Mainnet,
  3: Network.Ropsten,
  4: Network.Rinkeby,
  5: Network.Goerli,
  42: Network.Kovan,
};

export const Errors = {
  NoEtherscanApiKey: 'Etherscan API key not found',
  NoContractFound: 'Contract Instance not found',
  EtherscanResponseFailed: 'Etherscan Response failed',
  InvalidABI: 'Invalid ABI',
  InvalidChainNode: 'Invalid Chain Node',
};

type FetchEtherscanContractReq = {
  address: string;
};

type FetchEtherscanContractResp = {
  contract: ContractAttributes;
  contractAbi: ContractAbiAttributes;
};

export const fetchEtherscanContract = async (
  models: DB,
  req: TypedRequestBody<FetchEtherscanContractReq>,
  res: TypedResponse<FetchEtherscanContractResp>
) => {
  if (!ETHERSCAN_JS_API_KEY) {
    throw new AppError(Errors.NoEtherscanApiKey);
  }

  const { address } = req.body;

  // First check if the contract already has an abi entry in the database
  // get Contract Object from Db by address
  const contract = await models.Contract.findOne({
    where: { address },
  });
  if (!contract) {
    throw new AppError(Errors.NoContractFound);
  }

  // get chain node of contract from DB
  const chainNode = await models.ChainNode.findOne({
    where: { id: contract.chain_node_id },
  });
  if (
    !chainNode ||
    !chainNode.eth_chain_id ||
    !networkIdToName[chainNode.eth_chain_id]
  ) {
    return new AppError(Errors.InvalidChainNode);
  }

  const network = networkIdToName[chainNode.eth_chain_id];

  const fqdn = network === 'Mainnet' ? 'api' : `api-${network.toLowerCase()}`;

  // eslint-disable-next-line max-len
  const url = `https://${fqdn}.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_JS_API_KEY}`;

  const response = await axios.get(url, { timeout: 3000 });
  if (response.status === 200) {
    // Checks if etherscan abi is available by calling the fetchEtherscanContract api route
    const etherscanContract = response.data.result[0];
    if (etherscanContract && etherscanContract['ABI'] !== '') {
      const abiString = etherscanContract['ABI'];
      validateAbi(abiString);

      const nickname = etherscanContract['ContractName'];
      // Create new ABI
      // If source code fetch from etherscan is successful, then the abi is a verified one
      const [contract_abi] = await models.ContractAbi.findOrCreate({
        where: { nickname, abi: abiString, verified: true },
      });
      // update contract with new ABI
      contract.abi_id = contract_abi.id;
      await contract.save();
      return success(res, {
        contractAbi: contract_abi.toJSON(),
        contract: contract.toJSON(),
      });
    }
  } else {
    throw new AppError(Errors.EtherscanResponseFailed);
  }
};

type FetchEtherscanContractAbiReq = {
  address: string;
  chain_node_id: number;
};

type FetchEtherscanContractAbiResp = {
  contractAbi: string;
};

export const fetchEtherscanContractAbi = async (
  models: DB,
  req: TypedRequestBody<FetchEtherscanContractAbiReq>,
  res: TypedResponse<FetchEtherscanContractAbiResp>
) => {
  if (!ETHERSCAN_JS_API_KEY) {
    throw new AppError(Errors.NoEtherscanApiKey);
  }

  const { address, chain_node_id } = req.body;

  // First check if the contract already has an abi entry in the database
  // get Contract Object from Db by address

  // get chain node of contract from DB
  const chainNode = await models.ChainNode.findOne({
    where: { id: chain_node_id },
  });
  if (
    !chainNode ||
    !chainNode.eth_chain_id ||
    !networkIdToName[chainNode.eth_chain_id]
  ) {
    return new AppError(Errors.InvalidChainNode);
  }

  const network = networkIdToName[chainNode.eth_chain_id];

  const fqdn = network === 'Mainnet' ? 'api' : `api-${network.toLowerCase()}`;

  // eslint-disable-next-line max-len
  const url = `https://${fqdn}.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_JS_API_KEY}`;

  const response = await axios.get(url, { timeout: 3000 });
  if (response.status === 200) {
    // Checks if etherscan abi is available by calling the fetchEtherscanContract api route
    const etherscanContract = response.data.result[0];
    if (etherscanContract && etherscanContract['ABI'] !== '') {
      const abiString = etherscanContract['ABI'];
      validateAbi(abiString);

      return success(res, {
        contractAbi: abiString,
      });
    }
  } else {
    throw new AppError(Errors.EtherscanResponseFailed);
  }
};
