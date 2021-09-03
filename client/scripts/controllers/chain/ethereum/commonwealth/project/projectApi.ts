import BN from 'bn.js';
import { utils } from 'ethers';

import { Project as CMNProjectContract, } from 'eth/types';

import { CMNProject } from '../../../../../models';
import ContractApi from '../../contractApi';
import { EtherAddress, getTokenDetails } from '../utils';

export default class CMNProjectApi extends ContractApi<CMNProjectContract> {
  public readonly gasLimit: number = 3000000;

  public async getAcceptedTokens() {
    // TODO: getAllAcceptedTokens => getAcceptedTokens
    const tokens = await this.Contract.getAcceptedTokens();
    return getTokenDetails(tokens);
  }

  public async back(amount: number, token: string) {
    let transactionSuccessed = false;
    const tx = token === EtherAddress
      ? await this.Contract.backWithETH({ value: amount })
      : await this.Contract.back(token, amount, { gasLimit: this.gasLimit });

    const txReceipt = await tx.wait();
    transactionSuccessed = txReceipt.status === 1;

    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process backWithETH transaction'
    };
  }

  public async curate(amount: number, token: string) {
    let transactionSuccessed: boolean;
    try {
      const tx = token === EtherAddress
        ? await this.Contract.curateWithETH({ value: amount })
        : await this.Contract.curate(token, amount, { gasLimit: this.gasLimit });
      const txReceipt = await tx.wait();
      transactionSuccessed = txReceipt.status === 1;
    } catch (err) {
      transactionSuccessed = false;
    }
    return {
      status: transactionSuccessed ? 'success' : 'failed',
      error: transactionSuccessed ? '' : 'Failed to process curateWithETH transaction'
    };
  }

  public async redeemTokens(amount: number, token: string, isBToken: boolean) {
    let transactionSuccessed: boolean;
    try {
      const tx = isBToken
        ? await this.Contract.redeemBToken(token, amount, { gasLimit: this.gasLimit })
        : await this.Contract.redeemCToken(token, amount, { gasLimit: this.gasLimit });

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

  public async withdraw() {
    let transactionSuccessed: boolean;
    try {
      const tx = await this.Contract.withdraw({ gasLimit: this.gasLimit });
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

  public async getProjectDetails() {
    const metaData = await this.Contract.metaData();
    const { name, ipfsHash, cwUrl, beneficiary, creator } = metaData;

    const curatorFee = await this.Contract.curatorFee();
    const threshold = await this.Contract.threshold();
    const totalFunding = await this.Contract.totalFunding();
    const funded = await this.Contract.funded();
    const lockedWithdraw = await this.Contract.lockedWithdraw();
    const daedline = (new BN((await this.Contract.deadline()).toString()).mul(new BN(1000))).toNumber();
    const endTime = new Date(daedline);

    const projectHash = utils.solidityKeccak256(
      ['address', 'address', 'bytes32', 'uint256'],
      [creator, beneficiary, name, threshold.toString()]
    );

    let status = 'In Progress';
    if ((new Date()).getTime() - endTime.getTime() > 0) {
      status = funded ? 'Successed' : 'Failed';
    }

    const acceptedTokens = await this.getAcceptedTokens();
    const acceptedTokenAddresses = acceptedTokens.map((t) => t.address.toLowerCase());
    const bTokens = {};
    const cTokens = {};
    for (let i = 0; i < acceptedTokenAddresses.length; i++) {
      bTokens[acceptedTokenAddresses[i]] = (await this.Contract.getBToken(acceptedTokenAddresses[i])).toLowerCase();
      cTokens[acceptedTokenAddresses[i]] = (await this.Contract.getCToken(acceptedTokenAddresses[i])).toLowerCase();
    }

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
      bTokens,
      cTokens,
      this.Contract.address,
    );
    return newProj;
  }
}
