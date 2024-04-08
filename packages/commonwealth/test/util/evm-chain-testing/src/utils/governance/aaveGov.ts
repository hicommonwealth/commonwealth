import Web3 from 'web3';
import { advanceEvmTime } from '../../routes/chain';
import { aave_gov, erc20 } from '../contracts';
import getProvider from '../getProvider';
import { IGovernor } from './IGovernor';

export class aaveGovernor implements IGovernor {
  readonly contractAddress = '0xEC568fffba86c094cf06b22134B23074DFE2252c';
  readonly aaveToken = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';

  public async createArbitraryProposal(
    accountIndex: number,
    advanceDays?: number | string,
  ): Promise<any> {
    const provider = getProvider();
    const contract = aave_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const aaveToken = erc20(this.aaveToken, provider);
    // Get min AAVE tokens to propose
    const propThershold = '80000';
    const bal = provider.utils.toBigInt(
      await aaveToken.methods.balanceOf(accounts).call(),
    );
    if (
      bal < provider.utils.toBigInt(Web3.utils.toWei(propThershold, 'ether'))
    ) {
      await aaveToken.methods
        .transfer(accounts, Web3.utils.toWei(propThershold, 'ether'))
        .send({
          from: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
          gas: '500000',
        });
    }
    // Delegate to proposer
    await aaveToken.methods
      .delegate(accounts)
      .send({ from: accounts, gas: '150000' });
    // Create Proposal
    const proposalId = await contract.methods
      .create(
        '0xEE56e2B3D491590B5b31738cC34d5232F378a8D5',
        ['0xB6E50599ba78c6cCd40dF8B903e3d76AE68dcc83'],
        ['0'],
        ['execute()'],
        ['0x'],
        [true],
        '0x2426029bb07fa6f4c7c60d427f63abbca45cf592822b01c3f7910f3735560c2b',
      )
      .send({ from: accounts, gas: '500000' });

    if (advanceDays) {
      // Advance time to make active
      const secs = Number(advanceDays) * 86400;
      const blocks = secs / 12 + 500;
      await advanceEvmTime(secs, blocks);
    }

    return {
      proposalId: String(
        proposalId['events']['ProposalCreated']['returnValues'][0],
      ),
      block: proposalId['blockNumber'],
    };
  }

  public async queueProposal(
    proposalId: string | number,
    advanceTime?: boolean | undefined,
  ): Promise<any> {
    const secs = 3 * 86400;
    const blocks = secs / 12 + 500;
    await advanceEvmTime(secs, blocks);

    const provider = getProvider();
    const contract = aave_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[0];
    const queued = await contract.methods
      .queue(proposalId)
      .send({ from: accounts, gas: '500000' });
    console.log(queued);
    return { block: queued['blockNumber'] };
  }

  public async cancelProposal(proposalId: string | number): Promise<any> {
    const provider = getProvider();
    const contract = aave_gov(this.contractAddress, provider);
    const aaveToken = erc20(this.aaveToken, provider);
    const accounts = await provider.eth.getAccounts();
    await aaveToken.methods
      .transfer(accounts[4], Web3.utils.toWei('80000', 'ether'))
      .send({ from: accounts[0], gas: '400000' });
    const cancel = await contract.methods
      .cancel(proposalId)
      .send({ from: accounts[0], gas: '200000' });
    console.log(cancel);
    return { block: cancel['blockNumber'] };
  }

  public async castVote(
    proposalId: string | number,
    accountIndex: number,
    forAgainst: boolean,
  ): Promise<any> {
    const provider = getProvider();
    const contract = aave_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const vote = await contract.methods
      .submitVote(proposalId, Number(forAgainst))
      .send({ from: accounts, gas: '1000000' });
    console.log(vote);
    return { block: vote['blockNumber'] };
  }

  public async getProposalDetails(proposalId: string | number): Promise<any> {
    const provider = getProvider();
    const contract = aave_gov(this.contractAddress, provider);
    const details = await contract.methods.getProposalById(proposalId).call();
    return details;
  }

  public async executeProposal(
    proposalId: string | number,
    advanceTime?: boolean | undefined,
  ): Promise<any> {
    const secs = 86400;
    const blocks = secs / 12 + 500;
    await advanceEvmTime(secs, blocks);
    const provider = getProvider();
    const contract = aave_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[0];
    const executed = await contract.methods
      .execute(proposalId)
      .send({ from: accounts, value: '0', gas: '1000000' });
    console.log(executed);
    return { block: executed['blockNumber'] };
  }

  public async getVotes(
    accountIndex: number,
    numberOfVotes: string,
  ): Promise<any> {
    const provider = getProvider();
    const aaveToken = erc20(this.aaveToken, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const currBalance = provider.utils.toBigInt(
      await aaveToken.methods.balanceOf(accounts).call(),
    );
    const tokensNeeded = provider.utils.toBigInt(
      provider.utils.toWei(numberOfVotes, 'ether'),
    );
    let txReceipt;
    if (currBalance < tokensNeeded) {
      try {
        txReceipt = await aaveToken.methods
          .transfer(accounts, tokensNeeded)
          .send({
            from: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
            gas: '500000',
          });
      } catch {
        txReceipt = await aaveToken.methods
          .transfer(accounts, tokensNeeded)
          .send({
            from: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Binance 7
            gas: '500000',
          });
      }
    }
    try {
      txReceipt = await aaveToken.methods
        .delegate(accounts)
        .send({ from: accounts, gas: '150000' });
    } catch {
      console.log('already Delegated');
    }
    return { block: txReceipt['blockNumber'] };
  }

  public async endToEndSim(): Promise<void> {
    const accts = [4, 5, 6, 7];
    for (const idx of accts) {
      await this.getVotes(idx, '100000');
    }
    console.log('creating Prop');
    const proposalId = (await this.createArbitraryProposal(0))['proposalId'];
    for (const idx of accts) {
      await this.castVote(proposalId, idx, true);
    }
    console.log('queuing');
    await this.queueProposal(proposalId, true);
    console.log('executing');
    await this.executeProposal(proposalId, true);
  }
}
