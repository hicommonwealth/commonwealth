import { utils } from 'ethers';
import BN from 'bn.js';
import $ from 'jquery';

import { ProjectFactory as CMNProjectProtocolContract, Project as CMNProjectContract } from 'eth/types';
import { CMNProject } from '../../../../../models';
import ContractApi from '../../contractApi';

export interface ProjectMetaData {
  name: string
  description: string,
  creator: string,
  beneficiary: string,
  threshold: number,
  curatorFee: number,
  period: number,
  acceptedTokens: string[]
}

export const EtherAddress = '0x0000000000000000000000000000000000000000';

export default class CMNProjectAPI extends ContractApi<CMNProjectProtocolContract> {
  private _projectApis;

  public async init() {
    this._projectApis = {};
    super.init();
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

  public async getProjectDetails(projAddress: string) {
    const projContract = this._projectApis[projAddress];

    const name = await projContract.name();
    const ipfsHash = await projContract.ipfsHash();
    const cwUrl = await projContract.cwUrl();
    const beneficiary = await projContract.beneficiary();
    const curatorFee = await projContract.curatorFee();
    const creator = await projContract.creator();
    const threshold = await projContract.threshold();
    const totalFunding = await projContract.totalFunding();
    const acceptedTokens = await projContract.acceptedTokens();
    const funded = await projContract.funded();
    const lockedWithdraw = await projContract.lockedWithdraw();
    const daedline = (new BN((await projContract.deadline()).toString()).mul(new BN(1000))).toNumber();
    const endTime = new Date(daedline);

    const projectHash = utils.solidityKeccak256(
      ['address', 'address', 'bytes32', 'uint256'],
      [creator, beneficiary, name, threshold.toString()]
    );

    let status = 'In Progress';
    if ((new Date()).getTime() - endTime.getTime() > 0) {
      if (funded) {
        status = 'Successed';
      } else {
        status = 'Failed';
      }
    }

    const bToken = await projContract.bToken();
    const cToken = await projContract.cToken();

    const newProj = new CMNProject(
      utils.parseBytes32String(name),
      '',
      utils.parseBytes32String(ipfsHash),
      utils.parseBytes32String(cwUrl),
      beneficiary,
      acceptedTokens, // aceptedTokens
      [], // nominations,
      threshold, // decimals in 8
      endTime,
      curatorFee,
      projectHash,
      status,
      lockedWithdraw,
      totalFunding, // decimals in 8
      bToken,
      cToken,
      projAddress,
    );
    return newProj;
  }

  public async retrieveAllProjects() {
    const projects: CMNProject[] =  [];
    const projectAddresses = await this.Contract.getAllProjects();
    // const allProjectLenght = new BN((await this.Contract.allProjectsLength()).toString(), 10);
    if (projectAddresses.length > 0) {
      for (let i = 0; i < projectAddresses.length; i++) {
        const proj: CMNProject = await this.getProjectDetails(projectAddresses[i]);
        projects.push(proj);
      }
    }
    return projects;
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
    const endtime = Math.ceil(Math.ceil(Date.now() / 1000) + params.period * 24 * 60 * 60); // in days

    let transactionSuccessed: boolean;
    try {
      const tx = await contract.createProject(
        name,
        ipfsHash,
        cwUrl,
        params.beneficiary,
        params.acceptedTokens,
        nominations,
        params.threshold.toString(),
        endtime,
        params.curatorFee.toString(),
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
