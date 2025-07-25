import { ContestGovernorAbi } from '@commonxyz/common-protocol-abis';
import {
  erc20Abi,
  getTotalContestBalance,
  mustBeProtocolChainId,
  ValidChains,
  ViemChains,
} from '@hicommonwealth/evm-protocols';
import 'viem/window';

import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { createPublicClient, http } from 'viem';
import { AbiItem, TransactionReceipt } from 'web3';
import ContractBase from './ContractBase';
import NamespaceFactory from './NamespaceFactory';

const TOPIC_LOG =
  '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693';
class Contest extends ContractBase {
  namespaceFactoryAddress: string;
  namespaceFactory: NamespaceFactory;
  ethChainId: ValidChains;

  constructor(
    contractAddress: string,
    factoryAddress: string,
    rpc: string,
    ethChainId: number,
  ) {
    super(contractAddress, ContestGovernorAbi, rpc);
    this.namespaceFactoryAddress = factoryAddress;
    mustBeProtocolChainId(ethChainId);
    this.ethChainId = ethChainId;
  }

  async initialize(withWallet: boolean = false): Promise<void> {
    await super.initialize(withWallet);
    this.namespaceFactory = new NamespaceFactory(
      this.namespaceFactoryAddress,
      this.rpc,
    );
    await this.namespaceFactory.initialize(withWallet);
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
      // @ts-expect-error StrictNullChecks
      const eventLog = txReceipt.logs.find((log) => log.topics[0] == TOPIC_LOG);
      const newContestAddress = this.web3.eth.abi.decodeParameters(
        ['address', 'address', 'uint256', 'bool'],
        // @ts-expect-error StrictNullChecks
        eventLog.data.toString(),
      )['0'] as string;
      this.contractAddress = newContestAddress;
      return newContestAddress;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to initialize contest');
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
      // @ts-expect-error StrictNullChecks
      const eventLog = txReceipt.logs.find((log) => log.topics[0] == TOPIC_LOG);
      const newContestAddress = this.web3.eth.abi.decodeParameters(
        ['address', 'address', 'uint256', 'bool'],
        // @ts-expect-error StrictNullChecks
        eventLog.data.toString(),
      )['0'] as string;
      this.contractAddress = newContestAddress;
      return newContestAddress;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to initialize contest');
    }
  }

  async newSingleERC20Contest(
    namespaceName: string,
    contestInterval: number,
    winnerShares: number[],
    voteToken: string,
    voterShare: number,
    walletAddress: string,
    exchangeToken: string,
  ): Promise<string> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    try {
      const txReceipt = await this.namespaceFactory.newERC20Contest(
        namespaceName,
        contestInterval,
        winnerShares,
        voteToken,
        voterShare,
        walletAddress,
        exchangeToken,
      );
      // @ts-expect-error StrictNullChecks
      const eventLog = txReceipt.logs.find((log) => log.topics[0] == TOPIC_LOG);
      const newContestAddress = this.web3.eth.abi.decodeParameters(
        ['address', 'address', 'uint256', 'bool'],
        // @ts-expect-error StrictNullChecks
        eventLog.data.toString(),
      )['0'] as string;
      this.contractAddress = newContestAddress;
      return newContestAddress;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to initialize contest');
    }
  }

  async newSingleJudgedContest(
    namespaceName: string,
    contestInterval: number,
    winnerShares: number[],
    voterShare: number,
    walletAddress: string,
    exchangeToken: string,
    judgeId: number,
  ): Promise<string> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    try {
      const txReceipt = await this.namespaceFactory.newJudgedSingleContest(
        namespaceName,
        contestInterval,
        winnerShares,
        voterShare,
        walletAddress,
        exchangeToken,
        judgeId,
      );
      // @ts-expect-error StrictNullChecks
      const eventLog = txReceipt.logs.find((log) => log.topics[0] == TOPIC_LOG);
      const newContestAddress = this.web3.eth.abi.decodeParameters(
        ['address', 'address', 'uint256', 'bool'],
        // @ts-expect-error StrictNullChecks
        eventLog.data.toString(),
      )['0'] as string;
      this.contractAddress = newContestAddress;
      return newContestAddress;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to initialize contest');
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
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    this.reInitContract();
    const tokenAddress = await this.contract.methods.contestToken().call();

    let txReceipt;

    if (tokenAddress === ZERO_ADDRESS) {
      const weiAmount = this.web3.utils.toWei(amount, 'ether');
      //ETH funding route
      try {
        txReceipt = await this.contract.methods.deposit(weiAmount).send({
          value: weiAmount,
          from: walletAddress,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
        });
      } catch {
        throw new Error('ETH transfer failed');
      }
    } else {
      const token = new this.web3.eth.Contract(
        erc20Abi as unknown as AbiItem[],
        tokenAddress,
      );
      const decimals = await token.methods.decimals().call();
      const weiAmount = amount * 10 ** Number(decimals);
      await token.methods.approve(this.contractAddress, weiAmount).send({
        from: walletAddress,
      });
      txReceipt = await this.contract.methods.deposit(weiAmount).send({
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
      const winnerIds: number[] = await this.contract.methods
        .winnerIds()
        .call();

      return winnerIds.map((x) => Number(x));
    } catch (error) {
      throw Error('Failed to fetch winners' + error);
    }
  }

  //Indicate if contest is not recurring
  async getContestBalance(oneOff: boolean): Promise<number> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(false);
    }
    this.reInitContract();
    const contestBalance = await getTotalContestBalance(
      this.contractAddress,
      createPublicClient({
        chain: ViemChains[this.ethChainId],
        transport: http(this.rpc),
        batch: {
          multicall: true,
        },
      }),
      oneOff,
    );
    return parseInt(contestBalance, 10);
  }
}

export default Contest;
