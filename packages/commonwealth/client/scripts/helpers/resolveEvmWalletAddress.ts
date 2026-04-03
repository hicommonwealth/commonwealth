import { ChainBase } from '@hicommonwealth/shared';
import type { UserStoreProps } from 'client/scripts/state/ui/user';

const EVM_HEX_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function isEvmHexAddress(
  addr: string | undefined | null,
): addr is string {
  return !!addr && EVM_HEX_ADDRESS_RE.test(addr);
}

type EvmWalletUserSlice = Pick<
  UserStoreProps,
  'addressSelectorSelectedAddress' | 'activeAccount' | 'accounts' | 'addresses'
>;

/**
 * `activeAccount` is often unset or non-EVM when the thread’s community differs
 * from the global selection. Align with tRPC (`addressSelectorSelectedAddress`
 * → active → …) but only use 0x addresses for chain calls.
 */
export function resolveEvmWalletAddress(
  threadCommunityId: string,
  userSlice: EvmWalletUserSlice,
): string {
  type Row = {
    address: string;
    community: { id: string; base?: ChainBase };
  };
  const firstMatch = (
    rows: Row[],
    pred: (a: Row) => boolean,
  ): string | undefined =>
    rows.find((a) => pred(a) && isEvmHexAddress(a.address))?.address;

  return (
    [
      userSlice.addressSelectorSelectedAddress,
      userSlice.activeAccount?.address,
      firstMatch(
        userSlice.accounts,
        (a) => a.community.id === threadCommunityId,
      ),
      firstMatch(
        userSlice.addresses,
        (a) => a.community.id === threadCommunityId,
      ),
      firstMatch(
        userSlice.accounts,
        (a) => a.community.base === ChainBase.Ethereum,
      ),
      firstMatch(
        userSlice.addresses,
        (a) => a.community.base === ChainBase.Ethereum,
      ),
      userSlice.addresses.find((a) => isEvmHexAddress(a.address))?.address,
      userSlice.accounts.find((a) => isEvmHexAddress(a.address))?.address,
    ].find(isEvmHexAddress) ?? ''
  );
}
