import React, { useState } from 'react';

import app from 'state';
import { isNonEmptyString } from 'helpers/typeGuards';
import ITokenAdapter from '../models/ITokenAdapter';
import ChainInfo from '../models/ChainInfo';
import {
  CWBanner,
  CWMessageBanner,
} from './components/component_kit/cw_banner';
import { TermsBanner } from './components/terms_banner';

type SublayoutBannersProps = {
  banner?: string;
  chain: ChainInfo;
  terms?: string;
};

export const SublayoutBanners = ({
  banner,
  chain,
  terms,
}: SublayoutBannersProps) => {
  const bannerLocalStorageId = `${app.activeChainId()}-banner`;

  const [bannerStatus, setBannerStatus] = useState(
    localStorage.getItem(bannerLocalStorageId)
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
      {app.isLoggedIn() &&
        ITokenAdapter.instanceOf(app.chain) &&
        !app.user.activeAccount && (
          <CWBanner
            bannerContent={`Link an address that holds ${chain.default_symbol} to participate in governance.`}
          />
        )}
      {isNonEmptyString(terms) && <TermsBanner terms={terms} />}
    </>
  );
};
