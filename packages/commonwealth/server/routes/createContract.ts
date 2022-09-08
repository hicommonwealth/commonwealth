import { NextFunction } from 'express';
import Web3 from 'web3';
import BN from 'bn.js';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { ChainBase, ChainType, ContractType, NotificationCategories } from 'common-common/src/types';
import { urlHasValidHTTPPrefix } from '../../shared/utils';
import { ContractAttributes } from '../models/contract';
import { ChainNodeAttributes } from '../models/chain_node';
import testSubstrateSpec from '../util/testSubstrateSpec';
import { DB } from '../database';
import { TypedRequestBody, TypedResponse, success } from '../types';

import { AddressInstance } from '../models/address';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoType: 'Must provide contract type',
  NoBase: 'Must provide chain base',
  NoNodeUrl: 'Must provide node url',
  InvalidAddress: 'Address is invalid',
  InvalidNodeUrl: 'Node url must begin with http://, https://, ws://, wss://',
  InvalidNode: 'Node url returned invalid response',
  MustBeWs: 'Node must support websockets on ethereum',
  InvalidBase: 'Must provide valid chain base',
  InvalidChainId: 'Ethereum chain ID not provided or unsupported',
  InvalidChainIdOrUrl:
    'Could not determine a valid endpoint for provided chain',
  ContractAddressExists: 'The address already exists',
  ChainIDExists:
    'The id for this chain already exists, please choose another id',
  ChainNameExists:
    'The name for this chain already exists, please choose another name',
  NotAdmin: 'Must be admin',
};

type CreateContractReq = ContractAttributes & Omit<ChainNodeAttributes, 'id'> & {
  node_url: string;
  address: string;
  abi: string,
  contractType: ContractType;
};

type CreateContractResp = {
  contract: ContractAttributes;
  node: ChainNodeAttributes;
};

const createContract = async (
  models: DB,
  req: TypedRequestBody<CreateContractReq>,
  res: TypedResponse<CreateContractResp>,
  next: NextFunction
) => {
    if (!req.user) {
        return next(new Error('Not logged in'));
    }
    // require Admin privilege for creating Contract
    if (!req.user.isAdmin) {
        return next(new Error(Errors.NotAdmin));
    }

    if (!req.body.contractType || !req.body.contractType.trim()) {
        return next(new Error(Errors.NoType));
    }

    if (!Web3.utils.isAddress(req.body.address)) {
        return next(new Error(Errors.InvalidAddress));
    }

    const {
        address,
        contractType,
        abi,
        symbol,
        token_name,
        decimals
    } = req.body;

    const oldContract = await models.Contract.findOne({
        where: { address: req.body.address },
    });
    if (oldContract && oldContract.address === req.body.address) {
        return next(new Error(Errors.ContractAddressExists));
    }

    const eth_chain_id: number = req.body.eth_chain_id;

    // override provided URL for eth chains (typically ERC20) with stored, unless none found
    const node = await models.ChainNode.scope('withPrivateData').findOne({ where: {
        eth_chain_id,
    }});

    const contract_abi = await models.ContractAbi.create({
        abi,
    })

    const contract = await models.Contract.create({
        address,
        token_name,
        abi_id: contract_abi.id,
        symbol,
        decimals,
        type: contractType,
        chain_node_id: node.id,
    });

    if (req.body.address) {
        const [newContract] = await models.Contract.findOrCreate({
            where: {
                address: req.body.address,
                chain_node_id: node.id,
            },
            defaults: {
                address: req.body.address,
                chain_node_id: node.id,
                type: ContractType.ERC20,
            }
        });
    }

    const nodeJSON = node.toJSON();
    delete nodeJSON.private_url;

    return success(res, {
        contract: contract.toJSON(),
        node: nodeJSON,
    });
};

export default createContract;
