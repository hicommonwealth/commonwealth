import { ChainBase, ChainNetwork, ChainType } from '@hicommonwealth/shared';
import { isNonEmptyString } from 'helpers/typeGuards';
import React, { useState } from 'react';
import app from 'state';
import ChainInfo from '../models/ChainInfo';
import { CWMessageBanner } from './components/component_kit/cw_banner';
import { TermsBanner } from './components/terms_banner';

type SublayoutBannersProps = {
  banner?: string;
  chain: ChainInfo | null;
  terms?: string;
};

export const SublayoutBanners = ({
  banner,
  chain,
  terms,
}: SublayoutBannersProps) => {
  const bannerLocalStorageId = `${app.activeChainId()}-banner`;

  const [bannerStatus, setBannerStatus] = useState(
    localStorage.getItem(bannerLocalStorageId),
  );

  const handleDismissBanner = () => {
    setBannerStatus('off');
    localStorage.setItem(bannerLocalStorageId, 'off');
  };

  return (
    <>
      {banner && bannerStatus !== 'off' && (
        <CWMessageBanner bannerContent={banner} onClose={handleDismissBanner} />
      )}
      {!!chain &&
        app.isLoggedIn() &&
        ([ChainNetwork.Aave, ChainNetwork.Compound].includes(chain.network) ||
          chain.base === ChainBase.CosmosSDK) &&
        [ChainType.DAO, ChainType.Chain].includes(chain.type as ChainType)}
      {isNonEmptyString(terms) && <TermsBanner terms={terms} />}
    </>
  );
};
