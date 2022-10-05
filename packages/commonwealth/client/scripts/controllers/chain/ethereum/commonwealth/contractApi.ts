import { Web3Provider, ExternalProvider, JsonRpcSigner, Provider } from '@ethersproject/providers';
import { ethers, Contract } from 'ethers';
import { ChainBase, WalletId } from 'common-common/src/types';
import WebWalletController from 'controllers/app/web_wallets';
import MetamaskWebWalletController from 'controllers/app/webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import { Account, IWebWallet, NodeInfo } from 'models';

export type ContractFactoryT<ContractT> = (
  address: string, provider: Provider | JsonRpcSigner
) => ContractT;

export async function attachSigner<CT extends Contract>(
  wallets: WebWalletController,
  sender?: Account,
  contract?: CT,
  node?: NodeInfo,
  factory?: ContractFactoryT<CT>,
  address?: string,
): Promise<CT> {
  let signingWallet: IWebWallet<any>;
  if (sender) {
    signingWallet = await wallets.locateWallet(sender, ChainBase.Ethereum);
  } else {
    // hack to work around no sender provided
    signingWallet = wallets.getByName(WalletId.Metamask);
  }
  let signer: JsonRpcSigner;
  if (signingWallet instanceof MetamaskWebWalletController
    || signingWallet instanceof WalletConnectWebWalletController) {
    if (signingWallet.enabled && node && signingWallet.node !== node) {
      await signingWallet.reset();
    }
    if (!signingWallet.enabled) {
      await signingWallet.enable(node);
    }
    const walletProvider = new ethers.providers.Web3Provider(signingWallet.provider as any);
    // 12s minute polling interval (default is 4s)
    walletProvider.pollingInterval = 12000;
    if (sender) {
      signer = walletProvider.getSigner(sender.address);
    } else {
      // hack to work around no sender provided
      if (signingWallet.accounts.length === 0) {
        throw new Error('No signing account available on Metamask');
      }
      signer = walletProvider.getSigner(signingWallet.accounts[0]);
    }
  } else {
    throw new Error('Unsupported wallet');
  }

  if (!signer) {
    throw new Error('Could not get signer.');
  }
  if (contract) {
    const ct = contract.connect(signer) as CT;
    await ct.deployed();
    return ct;
  } else if (factory && address) {
    const ct = factory(address, signer) as CT;
    await ct.deployed();
    return ct;
  } else {
    throw new Error('Must provide contract or factory');
  }
}

abstract class ContractApi<ContractT extends Contract> {
  public readonly gasLimit: number = 3000000;

  public readonly contractAddress: string;
  public readonly Contract: ContractT;
  public readonly Provider: Web3Provider;

  constructor(
    factory: ContractFactoryT<ContractT>,
    contractAddress: string,
    web3Provider: ExternalProvider
  ) {
    this.contractAddress = contractAddress;
    this.Provider = new ethers.providers.Web3Provider(web3Provider);
    // 12s minute polling interval (default is 4s)
    this.Provider.pollingInterval = 12000;
    this.Contract = factory(this.contractAddress, this.Provider);
  }

  public async init(...args): Promise<void> {
    await this.Contract.deployed();
  }
}

export default ContractApi;
