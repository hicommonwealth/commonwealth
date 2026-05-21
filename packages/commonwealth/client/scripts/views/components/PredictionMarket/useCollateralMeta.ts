import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { getCollateralBalanceAndSymbol } from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import { useEffect, useState } from 'react';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';

type CollateralMeta = {
  symbol: string;
  decimals: number;
};

const DEFAULT_COLLATERAL_META: CollateralMeta = {
  symbol: 'ETH',
  decimals: 18,
};

const BASE_MAINNET_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const EMPTY_COLLATERAL_META: Record<string, CollateralMeta> = {};

const BASE_SEPOLIA_COLLATERAL_META: Record<string, CollateralMeta> = {
  // Base Sepolia USDC
  '0x036cbd53842c5426634e7929541ec2318f3dcf7e': { symbol: 'USDC', decimals: 6 },
  // Base Sepolia WETH
  '0x4200000000000000000000000000000000000006': {
    symbol: 'WETH',
    decimals: 18,
  },
};

const BASE_MAINNET_COLLATERAL_META: Record<string, CollateralMeta> = {
  // Base Mainnet USDC
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 },
  // Base Mainnet WETH
  '0x4200000000000000000000000000000000000006': {
    symbol: 'WETH',
    decimals: 18,
  },
};

type UseCollateralMetaProps = {
  communityId?: string;
  collateralAddress?: string | null;
  readerAddress?: string;
};

export const useCollateralMeta = ({
  communityId,
  collateralAddress,
  readerAddress,
}: UseCollateralMetaProps): CollateralMeta => {
  const [collateralMeta, setCollateralMeta] = useState<CollateralMeta>(
    DEFAULT_COLLATERAL_META,
  );

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId ?? '',
    includeNodeInfo: true,
    enabled: !!communityId,
  });
  const chainRpc =
    (community as { ChainNode?: { url?: string } } | undefined)?.ChainNode
      ?.url ?? '';
  const ethChainId =
    (community as { ChainNode?: { eth_chain_id?: number } } | undefined)
      ?.ChainNode?.eth_chain_id ?? 0;
  const knownCollateralMetaByChain =
    ethChainId === BASE_MAINNET_CHAIN_ID
      ? BASE_MAINNET_COLLATERAL_META
      : ethChainId === BASE_SEPOLIA_CHAIN_ID
        ? BASE_SEPOLIA_COLLATERAL_META
        : EMPTY_COLLATERAL_META;

  useEffect(() => {
    const addr = collateralAddress?.trim() ?? '';
    const isZero = !addr || addr.toLowerCase() === ZERO_ADDRESS.toLowerCase();
    if (isZero) {
      setCollateralMeta(DEFAULT_COLLATERAL_META);
      return;
    }
    const lower = addr.toLowerCase();
    const known = knownCollateralMetaByChain[lower];
    if (known) {
      setCollateralMeta(known);
      // Known addresses are deterministic enough for display and avoid RPC dependency.
      return;
    }
    if (!chainRpc) return;
    let cancelled = false;
    getCollateralBalanceAndSymbol(chainRpc, readerAddress ?? ZERO_ADDRESS, addr)
      .then(({ symbol, decimals }) => {
        if (!cancelled) setCollateralMeta({ symbol, decimals });
      })
      .catch(() => {
        if (!cancelled) setCollateralMeta(DEFAULT_COLLATERAL_META);
      });
    return () => {
      cancelled = true;
    };
  }, [chainRpc, collateralAddress, knownCollateralMetaByChain, readerAddress]);

  return collateralMeta;
};
