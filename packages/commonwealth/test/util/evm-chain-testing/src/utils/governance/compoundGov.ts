import Web3 from 'web3';
import { advanceEvmTime } from '../../routes/chain';
import { comp_gov, erc20 } from '../contracts';
import getProvider from '../getProvider';
import { IGovernor } from './IGovernor';

export class compoundGovernor implements IGovernor {
  readonly contractAddress = '0xc0Da02939E1441F497fd74F78cE7Decb17B66529';
  readonly compToken = '0xc00e94Cb662C3520282E6f5717214004A7f26888';
  readonly admin = '0x6d903f6003cca6255D85CcA4D3B5E5146dC33925';

  public async createArbitraryProposal(
    accountIndex: number,
    advanceDays?: string | number,
  ): Promise<any> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const compToken = erc20(this.compToken, provider);
    // Get min proposal COMP from 'bank'
    const bal = provider.utils.toBigInt(
      await compToken.methods.balanceOf(accounts).call(),
    );
    if (bal < provider.utils.toBigInt(Web3.utils.toWei('30000', 'ether'))) {
      await compToken.methods
        .transfer(accounts, Web3.utils.toWei('30000', 'ether'))
        .send({
          from: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
          gas: '100000',
        });
    }
    // Delegate to proposer
    await compToken.methods
      .delegate(accounts)
      .send({ from: accounts, gas: '150000' });
    // Create Proposal
    const proposalId = await contract.methods
      .propose(
        ['0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3'],
        [0],
        [''],
        [
          '0xecb9a875000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3000000000000000000000000c00e94cb662c3520282e6f5717214004a7f268880000000000000000000000000000000000000000000000000b84c09a3b930000',
        ],
        'Liquidation ratio propoasl',
      )
      .send({ from: accounts, gas: '1000000' });

    // Advance blocks/timestamp to make proposal active
    if (advanceDays) {
      const secs = Number(advanceDays) * 86400;
      const blocks = secs / 12 + 500;
      await advanceEvmTime(secs, blocks);
    }
    console.log(proposalId);

    return {
      proposalId: String(
        provider.eth.abi.decodeParameter(
          'uint256',
          String(proposalId.events?.ProposalCreated?.raw?.data).slice(0, 66),
        ),
      ),
      block: Number(proposalId['blockNumber']),
    };
  }

  public async cancelProposal(proposalId: string | number): Promise<any> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = await provider.eth.getAccounts();
    const cancel = await contract.methods
      .cancel(proposalId)
      .send({ from: accounts[0], gas: '150000' });
    console.log(cancel);
    return { block: Number(cancel['blockNumber']) };
  }

  public async castVote(
    proposalId: string | number,
    accountIndex: number,
    forAgainst: boolean,
  ): Promise<any> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const vote = await contract.methods
      .castVote(proposalId, Number(forAgainst))
      .send({ from: accounts, gas: '1000000' });
    console.log(vote);
    return { block: Number(vote['blockNumber']) };
  }

  public async getProposalDetails(proposalId: number | string): Promise<any> {
    const provider = getProvider();
    const contract = comp_gov(this.contractAddress, provider);
    const details = await contract.methods.proposals(proposalId).call();
    return details;
  }

  public async queueProposal(
    proposalId: string | number,
    advanceTime?: boolean,
  ): Promise<any> {
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
      .send({ from: accounts, gas: '500000' });
    console.log(queued);
    return { block: Number(queued['blockNumber']) };
  }

  public async executeProposal(
    proposalId: string | number,
    advanceTime?: boolean,
  ): Promise<any> {
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
      .send({ from: accounts, value: '0', gas: '1000000' });
    console.log(executed);
    return { block: Number(executed['blockNumber']) };
  }

  public async getVotes(
    accountIndex: number,
    numberOfVotes: string,
  ): Promise<any> {
    const provider = getProvider();
    const compToken = erc20(this.compToken, provider);
    const accounts = (await provider.eth.getAccounts())[accountIndex];
    const currBalance = provider.utils.toBigInt(
      await compToken.methods.balanceOf(accounts).call(),
    );
    const tokensNeeded = provider.utils.toBigInt(
      provider.utils.toWei(numberOfVotes, 'ether'),
    );
    let txReceipt;
    if (currBalance < tokensNeeded) {
      try {
        const binanceWalletAddress =
          '0xF977814e90dA44bFA03b6295A0616a897441aceC';
        const binanceWalletTokensAvailable = provider.utils.toBigInt(
          await compToken.methods.balanceOf(binanceWalletAddress).call(),
        );
        txReceipt = await compToken.methods
          .transfer(accounts, binanceWalletTokensAvailable)
          .send({
            from: binanceWalletAddress,
            gas: '100000',
          });
      } catch (e) {
        console.error('Failed to transfer tokens from binance wallet', e);
      }

      const newBalance = provider.utils.toBigInt(
        await compToken.methods.balanceOf(accounts).call(),
      );

      if (newBalance < tokensNeeded) {
        try {
          const fundWalletAddress =
            '0xfA9b5f7fDc8AB34AAf3099889475d47febF830D7';
          const fundWalletTokensAvailable = provider.utils.toBigInt(
            await compToken.methods.balanceOf(fundWalletAddress).call(),
          );
          txReceipt = await compToken.methods
            .transfer(accounts, fundWalletTokensAvailable)
            .send({
              from: fundWalletAddress,
              gas: '100000',
            });
        } catch (e) {
          console.log('Failed to transfer tokens from fund wallet', e);
        }
      }
    }

    const newBalance = provider.utils.toBigInt(
      await compToken.methods.balanceOf(accounts).call(),
    );
    if (newBalance < tokensNeeded) {
      console.error('Not enough tokens in binance and fund wallet');
      return;
    }

    try {
      txReceipt = await compToken.methods
        .delegate(accounts)
        .send({ from: accounts, gas: '150000' });
    } catch {
      console.log('already Delegated');
    }
    return { block: Number(txReceipt?.blockNumber) };
  }

  public async endToEndSim(): Promise<void> {
    const accts = [4, 5, 6, 7];
    for (const idx of accts) {
      await this.getVotes(idx, '120000');
    }
    const proposalId = (await this.createArbitraryProposal(0, 3))['proposalId'];
    for (const idx of accts) {
      await this.castVote(proposalId, idx, true);
    }
    await this.queueProposal(proposalId, true);
    await this.executeProposal(proposalId, true);
  }
}
