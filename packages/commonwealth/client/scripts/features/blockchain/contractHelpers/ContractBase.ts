import { ValidChains } from '@hicommonwealth/evm-protocols';
import { ChainBase } from '@hicommonwealth/shared';
import WebWalletController from 'controllers/app/web_wallets';
import IWebWallet from 'models/IWebWallet';
import { distributeSkale } from 'utils/skaleUtils';
import Web3, { Contract } from 'web3';
import { AbiItem } from 'web3-utils';

type WalletAccount = { address: string } | string;
type GenericContractAbi = ConstructorParameters<typeof Contract>[0];

abstract class ContractBase<
  TAbi extends GenericContractAbi = GenericContractAbi,
> {
  protected contract: Contract<TAbi>;
  public contractAddress: string;
  protected wallet: IWebWallet<WalletAccount>;
  protected web3: Web3;
  protected initialized: boolean;
  protected walletEnabled: boolean;
  protected rpc: string;
  protected chainId: string;
  private abi: TAbi;

  constructor(contractAddress: string, abi: TAbi, rpc: string) {
    this.contractAddress = contractAddress;
    this.abi = abi;
    this.rpc = rpc;
  }

  async initialize(
    withWallet: boolean = false,
    chainId?: string,
    providerInstance?: unknown,
  ): Promise<void> {
    if (!this.initialized || withWallet || providerInstance) {
      try {
        this.chainId = chainId || '1';
        let provider: unknown = this.rpc;

        if (providerInstance) {
          provider = providerInstance;
          this.walletEnabled = true;
        } else if (withWallet) {
          this.wallet = WebWalletController.Instance.availableWallets(
            ChainBase.Ethereum,
          )[0];

          // always re-enable wallet connect with new chainId
          if (this.wallet?.name === 'walletconnect' || !this.wallet?.api) {
            await this.wallet.enable(chainId);
          }
          // @ts-expect-error StrictNullChecks
          await this.wallet.switchNetwork(chainId);
          provider = this.wallet.api.givenProvider;
          this.walletEnabled = true;

          await distributeSkale(this.getPrimaryAccountAddress(), chainId);
        }

        this.web3 =
          withWallet && this.wallet?.name === 'walletconnect'
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (this.wallet as any)._web3
            : new Web3(provider as ConstructorParameters<typeof Web3>[0]);
        this.contract = new this.web3.eth.Contract(
          this.abi as AbiItem[],
          this.contractAddress,
        ) as unknown as Contract<TAbi>;
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
    ) as unknown as Contract<TAbi>;
  }

  protected getPrimaryAccountAddress(): string {
    const account = this.wallet?.accounts?.[0];
    if (typeof account === 'string') {
      return account;
    }
    return account?.address ?? '';
  }

  async estimateGas(): Promise<bigint | null> {
    if (this.chainId && parseInt(this.chainId) === ValidChains.SKALE_TEST) {
      return BigInt(0.00012 * 1e9);
    }
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
