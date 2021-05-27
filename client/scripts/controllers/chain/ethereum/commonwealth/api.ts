import { utils } from 'ethers';
import BN from 'bn.js';

import ContractApi from 'controllers/chain/ethereum/contractApi';
import { EthereumCoin, ERC20Token } from 'adapters/chain/ethereum/types';
import WebWalletController from 'controllers/app/web_wallets';

import { CwProtocol as CWProtocolContract } from 'CWProtocol';
import { CwProjectFactory as CWProjectFactory } from 'CwProjectFactory';
import { CwProject as CWProject } from 'CwProject';
import { CWProject as Project } from 'models/CWProtocol';

export default class CommonwealthAPI extends ContractApi<CWProtocolContract> {
  public async getProjectDetails(projAddress: string) {
    const projContract: CWProject = await CWProjectFactory.connect(projAddress, this.Provider);

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

    const newProj = new Project(
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
    );
    return newProj;
  }

  public async retrieveAllProjects() {
    const projects: Project[] =  [];
    const allProjectLenght = new BN((await this.Contract.allProjectsLength()).toString(), 10);
    if (allProjectLenght.gt(new BN(0))) {
      const projectAddresses = await this.Contract.getAllProjects();
      for (let i=0; i<projectAddresses.length; i++) {
        const proj: Project = await this.getProjectDetails(projectAddresses[i]);
        projects.push(proj);
      }
    }
    return projects;
  }

  public async backOrCurateWithEther(contract: CWProject, amount: number, isBacking: boolean, withEther: boolean) {
    if (withEther) {
      if (isBacking) {
        // back logic
        const backTx = await contract.backWithETH({value: amount});
        console.log('====>backTx', backTx);
        const txReceipt = await backTx.wait();
        console.log('====>backTx txReceipt', txReceipt);
        return txReceipt.status === 1
      } else {
        // curate logic
        const curateTx = await contract.curateWithETH({value: amount});
        console.log('====>curateTx', curateTx);
        const txReceipt = await curateTx.wait();
        console.log('====>curateTx txReceipt', txReceipt);
        return txReceipt.status === 1
      }
    } else {
      // ERC20 token logic
    }
    return false;
  }

  public async redeemTokens(contract: CWProject, amount: number, isBToken: boolean, withEther: boolean) {
    if (withEther) {
      if (isBToken) {
        // redeemBTokens
        const redeemBTokenTx = await contract.redeemBToken('0x0000000000000000000000000000000000000000', amount);
        console.log('====>redeemBTokenTx', redeemBTokenTx);
        const txReceipt = await redeemBTokenTx.wait();
        console.log('====>redeemBTokenTx txReceipt', txReceipt);
        return txReceipt.status === 1
      } else {
        // redeemCTokens
        const redeemCTokenTx = await contract.redeemCToken('0x0000000000000000000000000000000000000000', amount);
        console.log('====>redeemCTokenTx', redeemCTokenTx);
        const txReceipt = await redeemCTokenTx.wait();
        console.log('====>redeemCTokenTx txReceipt', txReceipt);
        return txReceipt.status === 1
      }
    } else {
      // ERC20 token logic
    }

    return false;
  }

  public async withdraw(contract: CWProject) {    
    const withdrawTx = await contract.withdraw();
    console.log('====>withdrawTx', withdrawTx);
    const txReceipt = await withdrawTx.wait();
    console.log('====>redeemBTokenTx txReceipt', txReceipt);
    return txReceipt.status === 1
  }
}
