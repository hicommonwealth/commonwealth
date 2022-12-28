import axios from 'axios';
import axiosRetry from 'axios-retry';
import { AppError, ServerError } from 'common-common/src/errors';
import { DB } from '../models';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { ETHERSCAN_JS_API_KEY } from '../config';
import { ContractAttributes } from '../models/contract';
import { ContractAbiAttributes } from '../models/contract_abi';

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

type FetchEtherscanContractReq = {
  address: string;
};

type FetchEtherscanContractResp = {
  contract: ContractAttributes;
  contractAbi: ContractAbiAttributes;
}

const fetchEtherscanContract = async (
  models: DB,
  req: TypedRequestBody<FetchEtherscanContractReq>,
  res: TypedResponse<FetchEtherscanContractResp>
) => {
  if (!ETHERSCAN_JS_API_KEY) {
    throw new ServerError('Etherscan API key not found');
  }

  const { address } = req.body;

  // First check if the contract already has an abi entry in the database
  // get Contract Object from Db by address
  const contract = await models.Contract.findOne({
    where: { address },
  });
  if (!contract) {
    throw new AppError('Contract not found.');
  }

  if (contract.abi_id !== null) {
    throw new AppError('Contract already has an abi entry in the database');
  }

  // get chain node of contract from DB
  const chainNode = await models.ChainNode.findOne({
    where: { id: contract.chain_node_id },
  });
  if (!chainNode || !chainNode.eth_chain_id || !networkIdToName[chainNode.eth_chain_id]) {
    return new AppError('Invalid chain node');
  }

  const network = networkIdToName[chainNode.eth_chain_id];

  const fqdn = network === 'Mainnet' ? 'api' : `api-${network.toLowerCase()}`;

  // eslint-disable-next-line max-len
  const url = `https://${fqdn}.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_JS_API_KEY}`
  axiosRetry(axios, {
    retries: 3,
    shouldResetTimeout: true,
    retryCondition: (_error) => true, // retry no matter what
  });

  try {
    const response = await axios.get(url, { timeout: 3000 });
    if (response.status === 200) {
      // check if etherscan abi is available by calling the fetchEtherscanContract api route
      const etherscanContract = response.data.result[0];
      if (etherscanContract && etherscanContract['ABI'] !== '') {
        const abiString = etherscanContract['ABI'];
        // TODO: validate here
        const nickname = etherscanContract['ContractName'];
        // create new ABI
        const [contract_abi] = await models.ContractAbi.findOrCreate({
          where: { nickname, abi: abiString, verified: true }, // TODO: verified correct here?
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
      throw new AppError('Couldn\'t fetch contract from etherscan');
    }
  } catch (error) {
    throw new ServerError(error.message);
  }
};

export default fetchEtherscanContract;
