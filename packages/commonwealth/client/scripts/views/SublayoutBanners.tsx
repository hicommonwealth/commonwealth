import { ChainBase, ChainNetwork, ChainType } from '@hicommonwealth/core';
import { isNonEmptyString } from 'helpers/typeGuards';
import React, { useState } from 'react';
import app from 'state';
import ChainInfo from '../models/ChainInfo';
import {
  CWMessageBanner,
  Old_CWBanner,
} from './components/component_kit/cw_banner';
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
        [ChainType.DAO, ChainType.Chain].includes(chain.type as ChainType) &&
        !app.user.activeAccount && (
          <Old_CWBanner
            bannerContent={`Link an address that holds ${chain.default_symbol} to participate in governance.`}
          />
        )}
      {isNonEmptyString(terms) && <TermsBanner terms={terms} />}
    </>
  );
};
