import { WalletId } from '@hicommonwealth/shared';
import { getWallets } from '@mysten/wallet-standard';
import SuiWebWalletController, { Wallet } from './sui_web_wallet';
class SuietWebWalletController extends SuiWebWalletController {
  public name = WalletId.SuietWallet;
  public label = 'Suiet Wallet';

  override get available() {
    const availableWallets = getWallets().get();
    // Suiet is a specific wallet that should be available
    const wallet = availableWallets.find((w) =>
      w.name.toLowerCase().includes('suiet'),
    );
    if (wallet) {
      return true;
    }
    return false;
  }

  override getSuiWalletProvider(): Wallet | null {
    const availableWallets = getWallets().get() as unknown[] as Wallet[];

    if (availableWallets.length === 0) {
      console.log('No Sui wallets available');
      return null;
    }

    // Filter wallets that support Sui chains and standard:connect feature
    const compatibleWallets = availableWallets.filter((wallet) => {
      const hasSuiChain = wallet.chains.some((chain) =>
        chain.startsWith('sui:'),
      );
      const hasConnectFeature = 'standard:connect' in wallet.features;
      return hasSuiChain && hasConnectFeature;
    });

    if (compatibleWallets.length === 0) {
      console.log('No compatible Sui wallets found');
      return null;
    }

    // Prioritize known wallet names if multiple are available
    const walletPriority = ['suiet'];

    for (const priorityName of walletPriority) {
      const priorityWallet = compatibleWallets.find((w) =>
        w.name.toLowerCase().includes(priorityName.toLowerCase()),
      );
      if (priorityWallet) return priorityWallet;
    }

    // If no priority wallet found, return the first compatible wallet
    return compatibleWallets[0];
  }
}

export default SuietWebWalletController;
