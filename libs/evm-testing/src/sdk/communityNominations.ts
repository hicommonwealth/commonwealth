import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import Web3, { AbiFragment, Contract } from 'web3';
import { community_nominations } from '../utils/contracts';
import { SdkBase } from './sdkBase';

export class CommunityNominations extends SdkBase {
  public address: string = cp.factoryContracts[84532].communityNomination;
  public contract: Contract<AbiFragment[]>;

  constructor(web3?: Web3) {
    super(web3);
    this.contract = community_nominations(this.address, this.web3);
  }

  /**
   * Nominate judges for a contest
   * @param namespace Community namespace name
   * @param judges Array of judge addresses to nominate
   * @param judgeId Judge token ID for the contest
   * @param accountIndex Account index to send transaction from
   */
  async nominateJudges(
    namespace: string,
    judges: string[],
    judgeId: number,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const account = (await this.getAccounts())[accountIndex ?? 0];
    const txReceipt = await this.contract.methods
      .nominateJudges(namespace, judges, judgeId)
      .send({
        value: this.web3.utils.toWei(
          (cp.NOMINATION_FEE * judges.length).toString(),
          'ether',
        ),
        from: account,
        gas: '500000',
      });
    return { block: Number(txReceipt['blockNumber']) };
  }
}
