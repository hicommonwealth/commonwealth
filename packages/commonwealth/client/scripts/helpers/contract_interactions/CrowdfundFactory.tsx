import { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';
import { BackParams, CreateProjectParams, WithdrawBackParams } from './types';

const abi = [];

class CrowdfundFactory extends ContractBase {
  constructor(contractAddress: string) {
    super(contractAddress, abi);
  }
  async createProject(prop: CreateProjectParams): Promise<string> {
    const farcasterContract = new this.web3.eth.Contract([] as AbiItem[], '');
    //TODO: fetch this based on ID
    const farcasterAddress = '';

    const projectData = {
      _name: this.web3.utils.asciiToHex(prop.name),
      _ipfsHash: this.web3.utils.asciiToHex(''),
      _url: this.web3.utils.asciiToHex(prop.url),
      _beneficiary: farcasterAddress,
      _acceptedToken: 'Weth Address here', //TODO
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
