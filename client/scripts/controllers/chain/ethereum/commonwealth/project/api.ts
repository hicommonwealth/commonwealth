import { utils } from 'ethers';
import BN from 'bn.js';
import $ from 'jquery';

import {
  ProjectFactory as CMNProjectProtocolContract,
  Project as CMNProjectContract,
  Project__factory,
  ERC20__factory
} from 'eth/types';
import TokenApi from '../../token/api';

import { CMNProject } from '../../../../../models';
import ContractApi from '../../contractApi';
import EthereumChain from '../../chain';

export interface ProjectMetaData {
  name: string
  description: string,
  creator: string,
  beneficiary: string,
  acceptedTokens: string[]
  threshold: number,
  curatorFee: number,
  deadline: number,
}

export const EtherAddress = '0x0000000000000000000000000000000000000000';

export default class CMNProjectAPI extends ContractApi<CMNProjectProtocolContract> {
  public readonly gasLimit: number = 3000000;

  private _chain: EthereumChain;
  private _projectApis;

  public async init() {
    this._projectApis = {};
    super.init();
  }

  public async getAcceptedTokens(projContract?: CMNProjectContract) {
    if (projContract) {
      const tokenAddresses = await projContract.getAllAcceptedTokens();
      return tokenAddresses;
    }
    const tokenAddresses = await this.Contract.getAllAcceptedTokens();
    return tokenAddresses;
  }

  public getProjectAPI(projAddress: string) {
    if (Object.keys(this._projectApis).includes(projAddress)) {
      return this._projectApis[projAddress];
    }
    return null;
  }

  public setProjectAPI(projAddress: string, projectAPI: ContractApi<CMNProjectContract>) {
    this._projectApis[projAddress] = projectAPI;
  }

  public async getTokenHolders(tokenAddress: string) {
    const COVALENTHQ_API_BASE_URL = 'https://api.covalenthq.com/v1';
    const CHAIN_ID = 42; // for kovan
    const apiUrl = `${COVALENTHQ_API_BASE_URL}/${CHAIN_ID}/tokens/${tokenAddress}/token_holders/`;

    const response = await $.get(apiUrl, {
      'key': 'ckey_1bee39d2c56f46e4aada2380624',
      'page-number': 0,
      'page-size': 200,
    });

    let tokenHolders = [];
    if (!response.error) {
      const { items, pagination, updated_at } = response.data;
      tokenHolders = items.map((item: any) => {
        const newItem = {
          address: item.address,
          balance: item.balance,
        };
        return newItem;
      });
    }

    return tokenHolders;
  }

  public async createProject(
    contract: CMNProjectProtocolContract,
    params: ProjectMetaData
  ) {
    const name = utils.formatBytes32String(params.name);
    const ipfsHash = utils.formatBytes32String('0x01');
    const cwUrl = utils.formatBytes32String('commonwealth.im');
    const nominations = [params.creator, params.beneficiary];
    const endtime = Math.ceil(Math.ceil(Date.now() / 1000) + params.deadline * 24 * 60 * 60); // in days

    const curatorFee = params.curatorFee * 100;
    const threshold = new BN(params.threshold).mul(new BN(10).pow(new BN(8)));

    let transactionSuccessed: boolean;
    try {
      const tx = await contract.createProject(
        name,
        ipfsHash,
        cwUrl,
        params.beneficiary,
        params.acceptedTokens,
        nominations,
        threshold.toString(),
        endtime,
        curatorFee.toString(),
        { gasLimit: this.gasLimit }
      );
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch (err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process backWithETH transaction'
    };
  }

  public async back(contract: CMNProjectContract, amount: number, tokenAddress: string) {
    if (tokenAddress === EtherAddress) {
      let transactionSuccessed: boolean;
      try {
        const tx = await contract.backWithETH({ value: amount });
        const txReceipt = await tx.wait();
        transactionSuccessed = txReceipt.status === 1;
      } catch (err) {
        transactionSuccessed = false;
      }
      return {
        status: transactionSuccessed ? 'success' : 'failed',
        error: transactionSuccessed ? '' : 'Failed to process backWithETH transaction'
      };
    } else {
      // logic to ERC20 token backing
    }
  }

  public async curate(contract: CMNProjectContract, amount: number, tokenAddress: string) {
    if (tokenAddress === EtherAddress) {
      let transactionSuccessed: boolean;
      try {
        const tx = await contract.curateWithETH({ value: amount });
        const txReceipt = await tx.wait();
        transactionSuccessed = txReceipt.status === 1;
      } catch (err) {
        transactionSuccessed = false;
      }
      return {
        status: transactionSuccessed ? 'success' : 'failed',
        error: transactionSuccessed ? '' : 'Failed to process curateWithETH transaction'
      };
    } else {
      // logic to ERC20 token curating
    }
  }

  public async redeemBToken(contract: CMNProjectContract, amount: number, tokenAddress: string) {
    let transactionSuccessed: boolean;
    try {
      const tx = await contract.redeemBToken(tokenAddress, amount, { gasLimit: 3000000 });
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch (err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process redeemBToken transaction'
    };
  }

  public async redeemCToken(contract: CMNProjectContract, amount: number, tokenAddress: string) {
    let transactionSuccessed: boolean;
    try {
      const tx = await contract.redeemCToken(tokenAddress, amount, { gasLimit: 3000000 });
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch (err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process redeemCToken transaction'
    };
  }

  public async withdraw(contract: CMNProjectContract) {
    let transactionSuccessed: boolean;
    try {
      const tx = await contract.withdraw({ gasLimit: 3000000 });
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch (err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process withdraw transaction'
    };
  }
}
