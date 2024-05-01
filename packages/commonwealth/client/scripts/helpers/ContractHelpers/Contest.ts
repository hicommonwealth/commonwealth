import { AppError } from '@hicommonwealth/core';
import { TransactionReceipt } from 'web3';
import { ContestAbi } from './Abi/ContestAbi';
import ContractBase from './ContractBase';
import NamespaceFactory from './NamespaceFactory';

class Contest extends ContractBase {
  namespaceFactoryAddress: string;
  namespaceFactory: NamespaceFactory;

  constructor(contractAddress: string, factoryAddress: string, rpc: string) {
    super(contractAddress, ContestAbi, rpc);
    this.namespaceFactoryAddress = factoryAddress;
  }

  async initialize(withWallet: boolean = false): Promise<void> {
    await super.initialize(withWallet);
    this.namespaceFactory = new NamespaceFactory(
      this.namespaceFactoryAddress,
      this.rpc,
    );
    await this.namespaceFactory.initialize();
  }

  /**
   * deploys a new recurring contest and configures the feeManager to divert feeShare of
   * stake fees to new contest
   * @param namespaceName namespace name to configure for
   * @param contestInterval the recurrng contest interval in seconds
   * @param winnerShares the percent of each respective winning places prize(ie 5 = 5%)
   * @param stakeId the id of the community stake token, defaults to 2
   * @param prizeShare the % amount of the prize pool to payout each interval(ie 5 = 5%)
   * @param voterShare the % amount of prize pool claimable by voters each week(ie 5 = 5%)
   * @param feeShare the % amount of community stake fees to divert to contest(ie 5 = 5%)
   * @param weight the weight of each stake balance, defaults to 1
   * @param walletAddress the wallet address to make transactions from
   * @returns the contract address of the new contest
   */
  async newRecurringContest(
    namespaceName: string,
    contestInterval: number,
    winnerShares: number[],
    stakeId: number = 2,
    prizeShare: number,
    voterShare: number = 20,
    feeShare: number = 100,
    weight: number = 1,
    walletAddress: string,
  ): Promise<string> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }
    try {
      const txReceipt = await this.namespaceFactory.newContest(
        namespaceName,
        contestInterval,
        winnerShares,
        stakeId,
        voterShare,
        weight,
        walletAddress,
        undefined,
        feeShare,
        prizeShare,
      );
      const newContestAddress =
        txReceipt.events.NewContest.returnValues.contest;
      this.contractAddress = newContestAddress;
      return newContestAddress;
    } catch (error) {
      throw new Error('Failed to initialize contest ' + error);
    }
  }

  /**
   * deploys a new single run contest
   * @param namespaceName namespace name to configure for
   * @param contestLength amount of time the contest should run in seconds
   * @param winnerShares the percent of each respective winning places prize(ie 5 = 5%)
   * @param stakeId the id of the community stake token, defaults to 2
   * @param voterShare the % amount of prize pool claimable by voters each week(ie 5 = 5%)
   * @param weight the weight of each stake balance, defaults to 1
   * @param walletAddress the wallet address to make transactions from
   * @param exchangeToken the token address for the prize. (ETH should be a 20 byte 0 address)
   * @returns the contract address of the new contest
   */
  async newSingleContest(
    namespaceName: string,
    contestLength: number,
    winnerShares: number[],
    stakeId: number = 2,
    voterShare: number = 20,
    weight: number = 1,
    walletAddress: string,
    exchangeToken: string,
  ): Promise<string> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }
    try {
      const txReceipt = await this.namespaceFactory.newContest(
        namespaceName,
        contestLength,
        winnerShares,
        stakeId,
        voterShare,
        weight,
        walletAddress,
        exchangeToken,
      );
      const newContestAddress =
        txReceipt.events.NewContest.returnValues.contest;
      this.contractAddress = newContestAddress;
      return newContestAddress;
    } catch (error) {
      throw new Error('Failed to initialize contest ' + error);
    }
  }

  /**
   * Allows for deposit of contest token(ETH or ERC20) to contest
   * @param amount amount in ether to send to contest
   * @param walletAddress the users wallet address
   * @returns transaction receipt
   */
  async deposit(
    amount: number,
    walletAddress: string,
  ): Promise<TransactionReceipt> {
    this.reInitContract();
    const tokenAddress = await this.contract.methods.contestToken().call();

    let txReceipt;
    const weiAmount = this.web3.utils.toWei(amount, 'ether');
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      //ETH funding route
      try {
        txReceipt = await this.contract.methods.deposit(weiAmount).send({
          value: weiAmount,
          from: walletAddress,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
        });
      } catch {
        throw new AppError('ETH transfer failed');
      }
    } else {
      const encodedParameters = this.web3.eth.abi.encodeParameters(
        ['address', 'uint256'],
        [this.contractAddress, amount],
      );
      const data = `095ea7b3${encodedParameters.substring(2)}`;

      // Create the transaction object
      const txObject = {
        to: tokenAddress,
        data: data,
        from: walletAddress,
      };
      const approveReceipt = this.web3.eth.sendTransaction(txObject);

      txReceipt = this.contract.methods.deposit(weiAmount).send({
        value: weiAmount,
        from: walletAddress,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
      });
    }
    return txReceipt;
  }

  async getCurrentWinners(): Promise<number[]> {
    if (this.contractAddress === '') {
      throw Error('Must provide contract address during initialization');
    }
    try {
      const winnerIds: any[] = await this.contract.methods.winnerIds().call();

      return winnerIds.map((x) => Number(x));
    } catch (error) {
      throw Error('Failed to fetch winners' + error);
    }
  }
}

export default Contest;
