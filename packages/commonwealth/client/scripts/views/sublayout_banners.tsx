import React from 'react';

import app from 'state';
import { isNonEmptyString } from '../helpers/typeGuards';
import type ChainInfo from '../models/ChainInfo';
import ITokenAdapter from '../models/ITokenAdapter';
import { CWBanner, CWMessageBanner, } from './components/component_kit/cw_banner';
import { TermsBanner } from './components/terms_banner';

type SublayoutBannersProps = {
  banner?: string;
  chain: ChainInfo;
  terms?: string;
  tosStatus?: string;
  bannerStatus?: string;
};

export const SublayoutBanners = (props: SublayoutBannersProps) => {
  const { banner, chain, terms, tosStatus, bannerStatus } = props;

  return (
    <>
      {banner && bannerStatus !== 'off' && (
        <CWMessageBanner
          bannerContent={banner}
          onClose={() =>
            localStorage.setItem(`${app.activeChainId()}-banner`, 'off')
          }
        />
      )}
      {app.isLoggedIn() &&
        ITokenAdapter.instanceOf(app.chain) &&
        !app.user.activeAccount && (
          <CWBanner
            bannerContent={`Link an address that holds ${chain.default_symbol} to participate in governance.`}
          />
        )}
      {isNonEmptyString(terms) && tosStatus !== 'off' && (
        <TermsBanner terms={terms} />
      )}
    </>
  );
};
