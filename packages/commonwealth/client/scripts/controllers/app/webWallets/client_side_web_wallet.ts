import app from 'state';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, BlockInfo, IWebWallet } from 'models';
import { CanvasData, constructCanvasMessage, chainBasetoCanvasChain } from 'commonwealth/shared/adapters/shared';

abstract class ClientSideWebWalletController<AccountT extends { address: string } | string> implements IWebWallet<AccountT> {
  /**
   * Parent class for wallets that sign login tokens on the client-side
   */

  name: WalletId;
  label: string;
  chain: ChainBase;
  defaultNetwork: ChainNetwork;

  // optional parameter used to specify the exact chain that a wallet is associated with (if any)
  specificChains?: string[];

  abstract get available(): boolean;
  abstract get enabled(): boolean;
  abstract get enabling(): boolean;
  abstract get accounts(): readonly AccountT[];

  abstract enable(): Promise<void>;

  abstract getChainId(): any;
  abstract getRecentBlock(): Promise<BlockInfo>;

  async getSessionPublicAddress() {
    const sessionController = app.sessions.getSessionController(this.chain);
    return sessionController.getOrCreateAddress(this.getChainId());
  }

  abstract signCanvasMessage(account: Account, canvasMessage: CanvasData): Promise<string>;

  public async signWithAccount(account: Account): Promise<string> {
    const canvasChain = chainBasetoCanvasChain(this.chain);
    const sessionPublicAddress = await this.getSessionPublicAddress();
    const chainId = await this.getChainId();

    const canvasMessage = constructCanvasMessage(
      canvasChain,
      chainId,
      account.address,
      sessionPublicAddress,
      account.validationBlockInfo,
    );

    return this.signCanvasMessage(account, canvasMessage);
  }

  public async validateWithAccount(account: Account, walletSignature: string): Promise<void> {
    return account.validate(walletSignature);
  }
}

export default ClientSideWebWalletController;
