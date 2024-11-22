import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { AbiFragment, Contract } from 'web3';
import { namespace_factory } from '../utils/contracts';
import { SdkBase } from './sdkBase';

const TOPIC_LOG =
  '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693';

export class NamespaceFactory extends SdkBase {
  public address: string = cp.factoryContracts[84532].factory;
  public contract: Contract<AbiFragment[]> = namespace_factory(
    this.address,
    this.web3,
  );

  /**
   * Deploys a new namespace. Note current wallet will be admin of namespace
   * @param name New Namespace name
   * @param accountIndex account index to create approve tx from
   */
  async deployNamespace(
    name: string,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const txReceipt = await this.contract.methods
      .deployNamespace(name, 'url.com', account, [])
      .send({
        from: account,
      });
    return { block: Number(txReceipt['blockNumber']) };
  }

  /**
   * Configures a community stakes id on the given namespace
   * Note: current wallet address must be an admin on the namespace specified
   * @param name Namespace name
   * @param stakesId the id on the namespace to use for stake
   * @param accountIndex account to send transaction from, must be admin
   */
  async configureCommunityStakes(
    name: string,
    stakesId: number,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const txReceipt = await this.contract.methods
      .configureCommunityStakeId(
        name,
        name + ' Community Stake',
        stakesId,
        '0x0000000000000000000000000000000000000000',
        2000000,
        0,
      )
      .send({ from: account });
    return { block: Number(txReceipt['blockNumber']) };
  }

  async newRecurringContest(
    namespaceName: string,
    contestInterval: number,
    winnerShares: number[],
    stakeId: number = 2,
    prizeShare: number,
    voterShare: number = 20,
    feeShare: number = 100,
    weight: number = 1,
    accountIndex?: number,
  ): Promise<{ block: number; contest: string }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const txReceipt = await this.contract.methods
      .newContest(
        namespaceName,
        contestInterval,
        winnerShares,
        stakeId,
        prizeShare,
        voterShare,
        feeShare,
        weight,
      )
      .send({ from: account });
    const eventLog = txReceipt.logs.find((log) => log.topics![0] == TOPIC_LOG);
    const newContestAddress = this.web3.eth.abi.decodeParameters(
      ['address', 'address', 'uint256', 'bool'],
      eventLog!.data!.toString(),
    )['0'] as string;
    return {
      block: Number(txReceipt['blockNumber']),
      contest: newContestAddress,
    };
  }

  async newSingleContest(
    namespaceName: string,
    contestLength: number,
    winnerShares: number[],
    exchangeToken: string,
    stakeId: number = 2,
    voterShare: number = 20,
    weight: number = 1,
    accountIndex?: number,
  ): Promise<{ block: number; contest: string }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const txReceipt = await this.contract.methods
      .newSingleContest(
        namespaceName,
        contestLength,
        winnerShares,
        stakeId,
        voterShare,
        weight,
        exchangeToken,
      )
      .send({ from: account });
    const eventLog = txReceipt.logs.find((log) => log.topics![0] == TOPIC_LOG);
    const newContestAddress = this.web3.eth.abi.decodeParameters(
      ['address', 'address', 'uint256', 'bool'],
      eventLog!.data!.toString(),
    )['0'] as string;
    return {
      block: Number(txReceipt['blockNumber']),
      contest: newContestAddress,
    };
  }

  /**
   * Gets the contract address for a namespace with the given name
   * @param name Namespace name
   * @returns contract address 0x...
   */
  async getNamespaceAddress(name: string): Promise<string> {
    const hexString = this.web3.utils.utf8ToHex(name);
    const activeNamespace: string = await this.contract.methods
      .getNamespace(hexString.padEnd(66, '0'))
      .call();
    return activeNamespace;
  }
}
