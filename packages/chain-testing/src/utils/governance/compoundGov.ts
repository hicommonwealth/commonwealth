import { comp_gov, erc20 } from '../contracts';
import getProvider from '../getProvider';
import { IGovernor } from './IGovernor';
import Web3 from 'web3';
import { advanceEvmTime } from '../../routes/chain';

export class compoundGovernor implements IGovernor {
  readonly contractAddress = '0xc0Da02939E1441F497fd74F78cE7Decb17B66529';
  readonly compToken = '0xc00e94Cb662C3520282E6f5717214004A7f26888';
  readonly admin = '0x6d903f6003cca6255D85CcA4D3B5E5146dC33925';

  public async createArbitraryProposal(
    advanceDays?: string | number
  ): Promise<string> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = await provider.eth.getAccounts();
    const compToken = erc20(this.compToken, provider);
    // Get min proposal COMP from 'bank'
    await compToken.methods
      .transfer(accounts[2], Web3.utils.toWei('30000'))
      .send({
        from: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
        gasLimit: 100000,
      });
    // Delegate to proposer
    await compToken.methods
      .delegate(accounts[0])
      .send({ from: accounts[2], gasLimit: 150000 });
    // Create Proposal
    const proposalId = await contract.methods
      .propose(
        ['0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3'],
        [0],
        [''],
        [
          '0xecb9a875000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3000000000000000000000000c00e94cb662c3520282e6f5717214004a7f268880000000000000000000000000000000000000000000000000b84c09a3b930000',
        ],
        'Liquidation ratio propoasl'
      )
      .send({ from: accounts[0], gasLimit: 1000000 });

    // Advance blocks/timestamp to make proposal active
    if (advanceDays) {
      const secs = Number(advanceDays) * 86400;
      const blocks = secs / 12 + 500;
      await advanceEvmTime(secs, blocks);
    }
    console.log(proposalId);

    return String(
      provider.eth.abi.decodeParameter(
        'uint256',
        String(proposalId['events']['ProposalCreated']['raw']['data']).slice(
          0,
          66
        )
      )
    );
  }

  public async cancelProposal(proposalId: string | number): Promise<void> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = await provider.eth.getAccounts();
    const cancel = await contract.methods
      .cancel(proposalId)
      .send({ from: accounts[0], gasLimit: 150000 });
    console.log(cancel);
  }

  public async castVote(
    proposalId: string | number,
    accountIndex: number,
    forAgainst: boolean
  ): Promise<void> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const vote = await contract.methods
      .castVote(proposalId, Number(forAgainst))
      .send({ from: accounts, gasLimit: 1000000 });
    console.log(vote);
  }

  public async getProposalDetails(proposalId: number | string): Promise<any> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const details = await contract.methods.proposals(proposalId).call();
    return details;
  }

  public async queueProposal(
    proposalId: string | number,
    advanceTime?: boolean
  ): Promise<void> {
    if (advanceTime) {
      const secs = Number(3) * 86400;
      const blocks = secs / 12 + 500;
      await advanceEvmTime(secs, blocks);
    }
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[0];
    const queued = await contract.methods
      .queue(proposalId)
      .send({ from: accounts, gasLimit: 500000 });
    console.log(queued);
  }

  public async executeProposal(
    proposalId: string | number,
    advanceTime?: boolean
  ): Promise<void> {
    if (advanceTime) {
      const secs = Number(5) * 86400;
      const blocks = secs / 12 + 500;
      await advanceEvmTime(secs, blocks);
    }
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[0];
    const executed = await contract.methods
      .execute(proposalId)
      .send({ from: accounts, value: 0, gasLimit: 1000000 });
    console.log(executed);
  }

  public async getVotes(
    accountIndex: number,
    numberOfVotes: string
  ): Promise<void> {
    const provider = getProvider();
    const compToken = erc20(this.compToken, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const currBalance = provider.utils.toBN(
      await compToken.methods.balanceOf(accounts).call()
    );
    const tokensNeeded = provider.utils.toBN(
      provider.utils.toWei(numberOfVotes)
    );
    if (currBalance.lt(tokensNeeded)) {
      try {
        await compToken.methods
          .transfer(accounts, tokensNeeded)
          .send({
            from: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
            gasLimit: 100000,
          });
      } catch {
        await compToken.methods
          .transfer(accounts, tokensNeeded)
          .send({
            from: '0xfA9b5f7fDc8AB34AAf3099889475d47febF830D7',
            gasLimit: 100000,
          });
      }
    }
    try {
      await compToken.methods
        .delegate(accounts)
        .send({ from: accounts, gasLimit: 150000 });
    } catch {
      console.log('already Delegated');
    }
  }

  public async endToEndSim(): Promise<void> {
    const accts = [4, 5, 6, 7];
    for (const idx of accts) {
      await this.getVotes(idx, '120000');
    }
    const proposalId = await this.createArbitraryProposal(3);
    for (const idx of accts) {
      await this.castVote(proposalId, idx, true);
    }
    await this.queueProposal(proposalId, true);
    await this.executeProposal(proposalId, true);
  }
}
