import { AppError } from '@hicommonwealth/adapters';
import { hashAbi } from '@hicommonwealth/model';
import axios from 'axios';
import { NextFunction } from 'express';
import { ETHERSCAN_JS_API_KEY } from '../config';
import type { DB } from '../models';
import type { ContractAttributes } from '../models/contract';
import type { ContractAbiAttributes } from '../models/contract_abi';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import validateAbi from '../util/abiValidation';

export enum Network {
  Mainnet = 'Mainnet',
  Goerli = 'Goerli',
}

export const networkIdToName = {
  1: Network.Mainnet,
  5: Network.Goerli,
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
  res: TypedResponse<FetchEtherscanContractResp>,
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
      const abiRecord = validateAbi(abiString);
      const abiHash = hashAbi(abiRecord);
      const nickname = etherscanContract['ContractName'];

      // If source code fetch from etherscan is successful, then the abi is a verified one
      let contractAbi = await models.ContractAbi.findOne({
        where: {
          nickname,
          abi_hash: abiHash,
        },
      });

      if (!contractAbi) {
        contractAbi = await models.ContractAbi.create({
          nickname,
          abi: abiRecord,
          abi_hash: abiHash,
          verified: true,
        });
      } else if (contractAbi && !contractAbi.verified) {
        contractAbi.verified = true;
        await contractAbi.save();
      }

      // update contract with new ABI
      contract.abi_id = contractAbi.id;
      await contract.save();
      return success(res, {
        contractAbi: contractAbi.toJSON(),
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
  contractAbi: Record<string, unknown>[];
};

export const fetchEtherscanContractAbi = async (
  models: DB,
  req: TypedRequestBody<FetchEtherscanContractAbiReq>,
  res: TypedResponse<FetchEtherscanContractAbiResp>,
  next: NextFunction,
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
    return next(new AppError(Errors.InvalidChainNode));
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
      const abiRecord = validateAbi(abiString);

      return success(res, {
        contractAbi: abiRecord,
      });
    }
  } else {
    throw new AppError(Errors.EtherscanResponseFailed);
  }
};
