import type Account from 'client/scripts/models/Account';

/**
 * Returns the EIP-1193 provider for the wallet that owns the given Ethereum address.
 * Use this for contract calls when the user may have multiple wallets (e.g. MetaMask + OKX)
 * so the correct wallet is used and you avoid "must provide an Ethereum address" errors.
 *
 * With multiple wallets enabled: the address you pass is the one the user selected (e.g. in
 * an address dropdown). We look up which wallet owns that address via locateWallet(), then
 * return that wallet's provider. The contract tx is therefore sent through the right wallet.
 *
 * @param address - Ethereum address (0x-prefixed, 42 chars)
 * @param ethChainId - Chain ID to switch to (e.g. 1, 8453)
 * @returns The provider for that address, or undefined if not found / invalid
 */
export async function getEthereumProviderForAddress(
  address: string,
  ethChainId: number,
): Promise<unknown> {
  if (!address || address.length < 40) {
    return undefined;
  }

  const { userStore } = await import('client/scripts/state/ui/user');
  const addresses = userStore.getState().addresses ?? [];

  const { ChainBase } = await import('@hicommonwealth/shared');
  const isMagic = addresses.some(
    (addr: { address?: string; walletId?: string }) =>
      addr.address?.toLowerCase() === address?.toLowerCase() &&
      addr.walletId?.toLowerCase()?.includes('magic'),
  );

  if (isMagic) {
    const { default: MagicWebWalletController } = await import(
      'client/scripts/controllers/app/webWallets/MagicWebWallet'
    );
    const { fetchNodes } = await import('client/scripts/state/api/nodes');
    await fetchNodes();
    const controller = new MagicWebWalletController();
    await controller.enable(String(ethChainId));
    return (controller as { provider?: unknown }).provider;
  }

  const account = addresses.find(
    (a: { address?: string; community?: { base?: string } }) =>
      a.address?.toLowerCase() === address?.toLowerCase() &&
      a.community?.base === ChainBase.Ethereum,
  );
  if (!account) return undefined;

  try {
    const { default: WebWalletController } = await import(
      'client/scripts/controllers/app/web_wallets'
    );
    const wallet = await WebWalletController.Instance.locateWallet(
      account as Account,
      ChainBase.Ethereum,
    );
    if (!wallet) return undefined;
    if (wallet.name === 'walletconnect' || !wallet.api) {
      await wallet.enable(String(ethChainId));
    }
    if (wallet.switchNetwork) {
      await wallet.switchNetwork(String(ethChainId));
    }
    return wallet.api?.givenProvider;
  } catch {
    return undefined;
  }
}
