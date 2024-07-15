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

export const SublayoutBanners = ({ banner, terms }: SublayoutBannersProps) => {
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
      {isNonEmptyString(terms) && <TermsBanner terms={terms} />}
    </>
  );
};
