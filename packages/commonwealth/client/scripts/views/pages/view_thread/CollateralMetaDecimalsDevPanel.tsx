import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { useCollateralMeta } from '../../components/PredictionMarket/useCollateralMeta';

/** Dev-only: one hook per row (Rules of Hooks). */
const CollateralMetaDevRow = ({
  communityId,
  label,
  tokenAddress,
}: {
  communityId: string;
  label: string;
  tokenAddress: string;
}) => {
  const meta = useCollateralMeta({
    communityId,
    collateralAddress: tokenAddress,
  });
  return (
    <div style={{ marginBottom: 8 }}>
      <CWText type="caption" fontWeight="semiBold">
        {label}
      </CWText>
      <CWText type="caption">
        {meta.symbol} · {meta.decimals} decimals
      </CWText>
      <CWText type="caption" className="text-muted">
        {tokenAddress}
      </CWText>
    </div>
  );
};

/** Dev-only smoke test for `useCollateralMeta` (known map vs RPC). */
export const CollateralMetaDecimalsDevPanel = ({
  communityId,
}: {
  communityId: string;
}) => {
  return (
    <div className="cards-column">
      <CWText type="caption" fontWeight="semiBold">
        useCollateralMeta (dev): USDC → 6, WETH → 18, DAI → 18 on Base (DAI
        usually via RPC). Other communities use that chain&apos;s RPC.
      </CWText>
      <CollateralMetaDevRow
        communityId={communityId}
        label="USDC (hardcoded Base map)"
        tokenAddress="0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
      />
      <CollateralMetaDevRow
        communityId={communityId}
        label="WETH (hardcoded Base map)"
        tokenAddress="0x4200000000000000000000000000000000000006"
      />
      <CollateralMetaDevRow
        communityId={communityId}
        label="DAI (typically via RPC; not in map)"
        tokenAddress="0x50c5725949a6f0c72e6c4a641f24049a917db0cb"
      />
    </div>
  );
};
