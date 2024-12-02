import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { AbiFragment, Contract } from 'web3';
import { community_stake } from '../utils/contracts';
import { NamespaceFactory } from './namespaceFactory';
import { SdkBase } from './sdkBase';

export class CommunityStake extends SdkBase {
  public address: string = cp.factoryContracts[84532].communityStake;
  public contract: Contract<AbiFragment[]> = community_stake(
    this.address,
    this.web3,
  );
  public namespaceFactory: NamespaceFactory = new NamespaceFactory();

  /**
   * Buy Community Stake, recalculates total buy as CS does not allow slippage
   * @param name namespace name
   * @param id id of community stake
   * @param amount amount to buy
   * @param accountIndex
   * @returns Block
   */
  async buyStake(
    name: string,
    id: number,
    amount: number,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const namespaceAddress =
      await this.namespaceFactory.getNamespaceAddress(name);
    const totalPrice: string = await this.contract.methods
      .getBuyPriceAfterFee(namespaceAddress, id.toString(), amount.toString())
      .call();
    const txReceipt = await this.contract.methods
      .buyStake(namespaceAddress, id, amount)
      .send({
        value: totalPrice,
        from: account,
      });
    return { block: Number(txReceipt['blockNumber']) };
  }

  /**
   * Sell Community Stake
   * @param name namespace name
   * @param id id of community stake
   * @param amount amount to sell
   * @param accountIndex
   */
  async sellStake(
    name: string,
    id: number,
    amount: number,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const namespaceAddress =
      await this.namespaceFactory.getNamespaceAddress(name);
    const txReceipt = await this.contract.methods
      .sellStake(namespaceAddress, id.toString(), amount.toString())
      .send({
        from: account,
      });
    return { block: Number(txReceipt['blockNumber']) };
  }
}
