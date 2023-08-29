import { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';
import { BackParams, CreateProjectParams, WithdrawBackParams } from './types';

const abi = [];

class CrowdfundFactory extends ContractBase {
  constructor(contractAddress: string) {
    super(contractAddress, abi);
  }
  async createProject(prop: CreateProjectParams): Promise<string> {
    //TODO:
    const farcasterContract = new this.web3.eth.Contract(
      [] as AbiItem[],
      '0xDA107A1CAf36d198B12c16c7B6a1d1C795978C42'
    );
    //TODO: fetch this based on ID
    const farcasterAddress = '';

    const projectData = {
      _name: this.web3.utils.asciiToHex(prop.name),
      _ipfsHash: this.web3.utils.asciiToHex(''),
      _url: this.web3.utils.asciiToHex(prop.url),
      _beneficiary: farcasterAddress,
      _acceptedToken: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', //Goerli WETH
      _threshold: prop.amountToFund,
      _deadline: prop.deadline,
    };

    const proposalAddress = await this.contract.methods.createProject(
      projectData,
      prop.donationWallet,
      prop.farcasterId,
      prop.minBacking
    );
    return proposalAddress.address;
  }
}

export default CrowdfundFactory;
