import BN from 'bn.js';
import { utils, BigNumber } from 'ethers';

import { Project as CMNProjectContract } from 'eth/types';

import { CMNProject } from '../../../../../models';
import ContractApi, { attachSigner } from '../../contractApi';
import { EtherAddress, getTokenDetails } from '../utils';
import EthereumChain from '../../chain';

export default class CMNProjectApi extends ContractApi<CMNProjectContract> {
  public readonly gasLimit: number = 3000000;

  public async getAcceptedTokens() {
    // TODO: getAllAcceptedTokens => getAcceptedTokens
    const tokens = await this.Contract.getAcceptedTokens();
    const tokensData = await getTokenDetails(tokens);
    return tokensData;
  }

  public async back(amount: BN, token: string, from: string, chain: EthereumChain) {
    try {
      const contract = await attachSigner(chain.app.wallets, from, this.Contract);
      const tx = token === EtherAddress
        ? await contract.backWithETH({ value: amount.toString() })
        : await contract.back(token, amount.toString(), { gasLimit: this.gasLimit });

      const txReceipt = await tx.wait();
      return txReceipt.status === 1;
    } catch (err) {
      return false;
    }
  }

  public async curate(amount: BN, token: string, from: string, chain: EthereumChain) {
    try {
      const contract = await attachSigner(chain.app.wallets, from, this.Contract);
      const tx = token === EtherAddress
        ? await contract.curateWithETH({ value: amount.toString() })
        : await contract.curate(token, amount.toString(), { gasLimit: this.gasLimit });
      const txReceipt = await tx.wait();
      return txReceipt.status === 1;
    } catch (err) {
      return false;
    }
  }

  public async redeemTokens(amount: BN, token: string, isBToken: boolean, from: string, chain: EthereumChain) {
    try {
      const contract = await attachSigner(chain.app.wallets, from, this.Contract);
      const tx = isBToken
        ? await contract.redeemBToken(token, amount.toString(), { gasLimit: this.gasLimit })
        : await contract.redeemCToken(token, amount.toString(), { gasLimit: this.gasLimit });
      const txReceipt = await tx.wait();
      return txReceipt.status === 1;
    } catch (err) {
      return false;
    }
  }

  public async withdraw(from: string, chain: EthereumChain) {
    try {
      const contract = await attachSigner(chain.app.wallets, from, this.Contract);
      const tx = await contract.withdraw({ gasLimit: this.gasLimit });
      const txReceipt = await tx.wait();
      return txReceipt.status === 1;
    } catch (err) {
      return false;
    }
  }

  public async setProjectDetails(project: CMNProject) {
    const funded = await this.Contract.funded();
    const lockedWithdraw = await this.Contract.lockedWithdraw();

    let status = 'In Progress';
    if ((new Date()).getTime() - project.endTime.getTime() > 0) {
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

    project.set(acceptedTokens, bTokens, cTokens, lockedWithdraw);
    return project;
  }

  public async getProjectInfo() {
    const metaData = await this.Contract.metaData();
    const { name, ipfsHash, cwUrl, beneficiary, creator } = metaData;

    // const projectHash = utils.solidityKeccak256(
    //   ['address', 'address', 'bytes32', 'uint256'],
    //   [creator, beneficiary, name, threshold.toString()]
    // );

    const curatorFee = await this.Contract.curatorFee();
    const threshold = (await this.Contract.threshold()).toNumber();
    const totalFunding = (await this.Contract.totalFunding()).toNumber();
    const funded = await this.Contract.funded();
    const endTimeBN = (await this.Contract.deadline()).mul(BigNumber.from(1000));
    const endTime = new Date(endTimeBN.toNumber());

    let status = 'In Progress';
    if ((new Date()).getTime() - endTime.getTime() > 0) {
      status = funded ? 'Successed' : 'Failed';
    }

    const newProj = new CMNProject(
      utils.parseBytes32String(name),
      '',
      utils.parseBytes32String(ipfsHash),
      threshold,
      endTime,
      this.Contract.address,
      beneficiary,
      utils.parseBytes32String(cwUrl),
      curatorFee,
      status,
      totalFunding,
      [], // TODO_CMN: nomination
    );
    return newProj;
  }
}
