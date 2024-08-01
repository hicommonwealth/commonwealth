import { ChainBase } from '@hicommonwealth/shared';
import WebWalletController from 'controllers/app/web_wallets';
import IWebWallet from 'models/IWebWallet';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

abstract class ContractBase {
  protected contract: any;
  public contractAddress: string;
  protected wallet: IWebWallet<any>;
  protected web3: Web3;
  protected initialized: boolean;
  protected walletEnabled: boolean;
  protected rpc: string;
  private abi: any;

  constructor(contractAddress: string, abi: any, rpc: string) {
    this.contractAddress = contractAddress;
    this.abi = abi;
    this.rpc = rpc;
  }

  async initialize(
    withWallet: boolean = false,
    chainId?: string,
  ): Promise<void> {
    if (!this.initialized || withWallet) {
      try {
        let provider = this.rpc;
        if (withWallet) {
          this.wallet = WebWalletController.Instance.availableWallets(
            ChainBase.Ethereum,
          )[0];

          if (!this.wallet.api) {
            await this.wallet.enable(chainId);
          }
          // @ts-expect-error StrictNullChecks
          await this.wallet.switchNetwork(chainId);
          provider = this.wallet.api.givenProvider;
          this.walletEnabled = true;
        }

        this.web3 = new Web3(provider);
        this.contract = new this.web3.eth.Contract(
          this.abi as AbiItem[],
          this.contractAddress,
        );
        this.initialized = true;
      } catch (error) {
        throw new Error('Failed to initialize contract: ' + error);
      }
    }
  }

  isInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'Contract not initialzed. Call Contract.initialize() first.',
      );
    }
  }

  protected reInitContract() {
    this.contract = new this.web3.eth.Contract(
      this.abi as AbiItem[],
      this.contractAddress,
    );
  }

  async estimateGas(): Promise<bigint | null> {
    try {
      const latestBlock = await this.web3.eth.getBlock('latest');

      // Calculate maxFeePerGas and maxPriorityFeePerGas
      const baseFeePerGas = latestBlock.baseFeePerGas;
      const maxPriorityFeePerGas = this.web3.utils.toWei('0.001', 'gwei');
      const maxFeePerGas =
        baseFeePerGas! * BigInt(2) + BigInt(parseInt(maxPriorityFeePerGas));
      return maxFeePerGas;
    } catch {
      return null;
    }
  }
}

export default ContractBase;
