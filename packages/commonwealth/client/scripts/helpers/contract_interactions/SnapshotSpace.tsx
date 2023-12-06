import { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';
import { BackParams, SnapshotVoteParams, WithdrawBackParams } from './types';
import CrowdfundContract from './CrowdfundContract';
import spaceAbi from './abis/spaceABI';
import farcasterHookAbi from './abis/farcasterHookABI';

class SnapshotSpace extends ContractBase {
  private crowdfundContract;
  public proposalIdCache;

  constructor(contractAddress: string, crowdFundAddress: string) {
    super(contractAddress, spaceAbi);
    this.crowdfundContract = new CrowdfundContract(crowdFundAddress);
  }

  async vote(prop: SnapshotVoteParams): Promise<void> {
    const proposalId = await this.getProposalId();
    const proposal = await this.contract.methods.proposal(proposalId).call();
    await this.contract.methods
      .vote(
        this.wallet.accounts[0],
        proposalId,
        prop.vote,
        proposal.enumeratedVotingStrategies,
        ''
      )
      .send({ from: this.wallet.accounts[0] });
  }

  async getProposalStatus(): Promise<any> {
    const proposalId = await this.getProposalId();
    const proposalStatus = await this.contract.methods
      .getProposalStatus(proposalId)
      .call();
    return proposalStatus;
  }

  private async getProposalId(): Promise<string> {
    if (!this.proposalIdCache) {
      const hookAddress = await this.crowdfundContract.methods
        .hookAddress()
        .call();
      const hookContract = new this.web3.eth.Contract(
        farcasterHookAbi as AbiItem[],
        hookAddress
      );
      this.proposalIdCache = await hookContract.methods
        .snapshotProposalId()
        .call();
    }
    return this.proposalIdCache;
  }
}

export default SnapshotSpace;
