import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { networkIdToName } from 'common-common/src/types';
import { AppError } from '../util/errors';
import { DB } from '../models';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { ETHERSCAN_JS_API_KEY } from '../config';

const fetchEtherscanContract = async (
  models: DB,
  req: Request,
  res: Response
) => {
  const { address } = req.body;

  //   First check if the contract already has an abi entry in the database
  // get Contract Object from Db by address
  const contract = await models.Contract.findOne({
    where: { address },
  });
  if (contract) {
    if (contract.abi_id !== null) {
      throw new AppError('Contract already has an abi entry in the database');
    } else {
      // get chain node of contract from DB
      const chainNode = await models.ChainNode.findOne({
        where: { id: contract.chain_node_id },
      });
      if (!chainNode) {
        return new AppError('Invalid chain node');
      }
      chainNode.eth_chain_id = chainNode.eth_chain_id || 1;

      const network = networkIdToName[chainNode.eth_chain_id];

      const fqdn =
        network === 'Mainnet' ? 'api' : `api-${network.toLowerCase()}`;

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

            // create new ABI
            const [contract_abi] = await models.ContractAbi.findOrCreate({
              where: { abi: abiString },
            });
            // update contract with new ABI
            contract.abi_id = contract_abi.id;
            await contract.save();
            return success(res, {
              contractAbi: contract_abi.toJSON(),
              contract,
            });
          }
        } else {
          console.log('error');
          throw new AppError("Couldn't fetch contract from etherscan");
        }
      } catch (error) {
        console.error(error);
        throw new AppError(error);
      }
    }
  } else {
    throw new AppError('No contract found in database');
  }
};

export default fetchEtherscanContract;
