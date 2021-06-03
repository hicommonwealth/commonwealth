import { utils } from 'ethers';
import BN from 'bn.js';
import $ from 'jquery';

import ContractApi from 'controllers/chain/ethereum/contractApi';
import { EthereumCoin } from 'adapters/chain/ethereum/types';

import { CwProtocol as CWProtocolContract } from 'CWProtocol';
import { CwProjectFactory as CWProjectFactory } from 'CwProjectFactory';
import { CwProject as CWProjectContract } from 'CwProject';
import { CWProject } from 'models/CWProtocol';

export const EtherAddress = '0x0000000000000000000000000000000000000000';
export default class CommonwealthAPI extends ContractApi<CWProtocolContract> {
  private _projectAPIs;

  public async init() {
    this._projectAPIs = {};
    super.init();
  }
  
  public getProjectAPI(projAddress: string) {
    if (Object.keys(this._projectAPIs).includes(projAddress)) {
      return this._projectAPIs[projAddress];
    }
    return null;
  }

  public setProjectAPI(projAddress: string, projectAPI: ContractApi<CWProjectContract>) {
    this._projectAPIs[projAddress] = projectAPI;
  }

  public async getProjectDetails(projAddress: string) {
    const projContract: CWProjectContract = await CWProjectFactory.connect(projAddress, this.Provider);

    const name = await projContract.name();
    const ipfsHash = await projContract.ipfsHash();
    const cwUrl = await projContract.cwUrl();
    const beneficiary = await projContract.beneficiary();
    const curatorFee = await projContract.curatorFee();
    const creator = await projContract.creator();

    const threshold = await projContract.threshold();
    const totalFunding = await projContract.totalFunding();

    const projectHash = utils.solidityKeccak256(
      ['address', 'address', 'bytes32', 'uint256'],
      [creator, beneficiary, name, threshold.toString()]
    );

    const daedline = (new BN((await projContract.deadline()).toString()).mul(new BN(1000))).toNumber();
    const endTime = new Date(daedline);
    const funded = await projContract.funded();

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

    const newProj = new CWProject(
      utils.parseBytes32String(name),
      '',
      utils.parseBytes32String(ipfsHash),
      utils.parseBytes32String(cwUrl),
      beneficiary,
      '0x00', // aceptedTokens
      [], // nominations,
      new EthereumCoin('ETH', new BN(threshold.toString()), false), //threshold,
      endTime,
      curatorFee,
      projectHash,
      status,
      new EthereumCoin('ETH', new BN(totalFunding.toString()), false), //totalFunding,
      bToken,
      cToken,
      projAddress,
    );
    return newProj;
  }

  public async retrieveAllProjects() {
    const projects: CWProject[] =  [];
    const allProjectLenght = new BN((await this.Contract.allProjectsLength()).toString(), 10);
    if (allProjectLenght.gt(new BN(0))) {
      const projectAddresses = await this.Contract.getAllProjects();
      for (let i=0; i<projectAddresses.length; i++) {
        const proj: CWProject = await this.getProjectDetails(projectAddresses[i]);
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
        }
        return newItem;
      });
    }

    return tokenHolders;
  }

  public async createProject(
    contract: CWProtocolContract,
    u_name: string,
    acceptedTokens: string[],
    u_description: string,
    creator: string,
    beneficiary: string,

    threshold: number,
    curatorFee: number,
    u_period: number, // in days
  ) {
    const name = utils.formatBytes32String(u_name);
    const ipfsHash = utils.formatBytes32String('0x01');
    const cwUrl = utils.formatBytes32String('commonwealth.im');
    const nominations = [creator, beneficiary];
    const endtime = Math.ceil(Math.ceil(Date.now() / 1000) + u_period * 24 * 60 * 60);

    let transactionSuccessed: boolean;
    try {
      const tx = await contract.createProject(
        name,
        ipfsHash,
        cwUrl,
        beneficiary,
        acceptedTokens,
        nominations,
        threshold.toString(),
        endtime,
        curatorFee.toString(),
        '', // projectID
      );
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch(err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process backWithETH transaction'
    };
  }

  public async back(
    contract: CWProjectContract,
    amount: number,
    tokenAddress: string,
  ) {
    if (tokenAddress === EtherAddress) {
      let transactionSuccessed: boolean;
      try {
        const tx = await contract.backWithETH({value: amount});
        const txReceipt = await tx.wait();
        transactionSuccessed = txReceipt.status === 1;
      } catch(err) {
        transactionSuccessed = false;
      }
      return {
        status: transactionSuccessed ? 'success' : 'failed',
        error: transactionSuccessed ? '' : 'Failed to process backWithETH transaction'
      };
    }
  }

  public async curate(
    contract: CWProjectContract,
    amount: number,
    tokenAddress: string,
  ) {
    if (tokenAddress === EtherAddress) {
      let transactionSuccessed: boolean;
      try {
        const tx = await contract.curateWithETH({value: amount});
        const txReceipt = await tx.wait();
        transactionSuccessed = txReceipt.status === 1;
      } catch(err) {
        transactionSuccessed = false;
      }
      return {
        status: transactionSuccessed ? 'success' : 'failed',
        error: transactionSuccessed ? '' : 'Failed to process curateWithETH transaction'
      };
    }
  }

  public async redeemBToken(
    contract: CWProjectContract,
    amount: number,
    tokenAddress: string,
  ) {
    let transactionSuccessed: boolean;
    try {
      const tx = await contract.redeemBToken(tokenAddress, amount, { gasLimit: 3000000 });
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch(err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process redeemBToken transaction'
    };
  }

  public async redeemCToken(
    contract: CWProjectContract,
    amount: number,
    tokenAddress: string,
  ) {
    let transactionSuccessed: boolean;
    try {
      const tx = await contract.redeemCToken(tokenAddress, amount, { gasLimit: 3000000 });
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch(err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process redeemCToken transaction'
    };
  }

  public async withdraw(contract: CWProjectContract) {
    let transactionSuccessed: boolean;
    try {
      const tx = await contract.withdraw({ gasLimit: 3000000 });
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch(err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process withdraw transaction'
    };
  }
}