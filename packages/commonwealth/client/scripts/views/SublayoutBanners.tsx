import React, { useState } from 'react';

import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { isNonEmptyString } from 'helpers/typeGuards';
import app from 'state';
import ChainInfo from '../models/ChainInfo';
import {
  CWMessageBanner,
  Old_CWBanner,
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
      {app.isLoggedIn() &&
        ([
          ChainNetwork.ERC721,
          ChainNetwork.ERC20,
          ChainNetwork.AxieInfinity,
          ChainNetwork.Ethereum,
        ].includes(app.chain.meta.network) ||
          [ChainBase.CosmosSDK, ChainBase.Solana].includes(
            app.chain.meta.base,
          )) &&
        !app.user.activeAccount && (
          <Old_CWBanner
            bannerContent={`Link an address that holds ${chain.default_symbol} to participate in governance.`}
          />
        )}
      {isNonEmptyString(terms) && <TermsBanner terms={terms} />}
    </>
  );
};
