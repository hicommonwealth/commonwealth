import { Web3Provider, AsyncSendable, JsonRpcSigner, Provider } from 'ethers/providers';
import { ethers, Contract } from 'ethers';

import { Erc20 } from 'Erc20';
import { Erc20Factory } from 'Erc20Factory';
import { ChainBase, IWebWallet } from 'models';
import WebWalletController from 'controllers/app/web_wallets';
import MetamaskWebWalletController from 'controllers/app/webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from '../../app/webWallets/walletconnect_web_wallet';

export type ContractFactoryT<ContractT> = (address: string, provider: Provider) => ContractT;


class ContractApi<ContractT extends Contract> {
  public readonly gasLimit: number = 3000000;

  private _contractAddress: string;
  private _Contract: ContractT;
  private _Provider: Web3Provider;
  private _tokenContract: Erc20;

  public get contractAddress() { return this._contractAddress; }
  public get Contract(): ContractT { return this._Contract; }
  public get Provider(): Web3Provider { return this._Provider; }
  public get tokenContract() { return this._tokenContract; }

  constructor(
    factory: ContractFactoryT<ContractT>,
    contractAddress: string,
    web3Provider: AsyncSendable
  ) {
    this._contractAddress = contractAddress;
    this._Provider = new ethers.providers.Web3Provider(web3Provider);
    this._Contract = factory(this._contractAddress, this._Provider);
  }

  public async attachSigner<CT extends Contract = ContractT>(
    wallets: WebWalletController,
    sender: string,
    contract?: CT
  ): Promise<CT> {
    const availableWallets = wallets.availableWallets(ChainBase.Ethereum);
    if (availableWallets.length === 0) {
      throw new Error('No wallet available');
    }

    let signingWallet: IWebWallet<string>;
    for (const wallet of availableWallets) {
      if (!wallet.enabled) {
        await wallet.enable();
      }
      // TODO: ensure that we can find any wallet, even if non-string accounts
      if (wallet.accounts.find((acc) => acc === sender)) {
        signingWallet = wallet;
        break;
      }
    }
    if (!signingWallet) {
      throw new Error('TX sender not found in wallet');
    }

    let signer: JsonRpcSigner;
    if (signingWallet instanceof MetamaskWebWalletController
      || signingWallet instanceof WalletConnectWebWalletController) {
      const walletProvider = new ethers.providers.Web3Provider(signingWallet.provider as any);
      signer = walletProvider.getSigner(sender);
    } else {
      throw new Error('Unsupported wallet');
    }

    if (!signer) {
      throw new Error('Could not get signer.');
    }
    if (contract) {
      return contract.connect(signer) as CT;
    } else {
      return this._Contract.connect(signer) as CT;
    }
  }

  public async init(tokenAddress?: string): Promise<void> {
    if (tokenAddress) {
      this._tokenContract = Erc20Factory.connect(tokenAddress, this._Provider);
    }
  }
}

export default ContractApi;
