import { Web3Provider, ExternalProvider, JsonRpcSigner, Provider } from '@ethersproject/providers';
import { ethers, Contract } from 'ethers';
import { ChainBase, IWebWallet } from 'models';
import WebWalletController from 'controllers/app/web_wallets';
import MetamaskWebWalletController from 'controllers/app/webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from '../../app/webWallets/walletconnect_web_wallet';

export type ContractFactoryT<ContractT> = (address: string, provider: Provider) => ContractT;

export async function attachSigner<CT extends Contract>(
  wallets: WebWalletController,
  sender: string,
  contract: CT
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
  const ct = contract.connect(signer) as CT;
  await ct.deployed();
  return ct;
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
    this.Contract = factory(this.contractAddress, this.Provider);
  }

  public async init(): Promise<void> {
    await this.Contract.deployed();
  }
}

export default ContractApi;
