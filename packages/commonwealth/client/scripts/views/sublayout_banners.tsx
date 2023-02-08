/* @jsx jsx */
import React from 'react';

import type { ResultNode} from 'mithrilInterop';
import { ClassComponent, jsx } from 'mithrilInterop';

import app from 'state';
import { isNonEmptyString } from '../helpers/typeGuards';
import type { ChainInfo } from '../models';
import { ITokenAdapter } from '../models';
import {
  CWBanner,
  CWMessageBanner,
} from './components/component_kit/cw_banner';
import { TermsBanner } from './components/terms_banner';

type SublayoutBannersAttrs = {
  banner?: string;
  chain: ChainInfo;
  terms?: string;
  tosStatus?: string;
  bannerStatus?: string;
};

export class SublayoutBanners extends ClassComponent<SublayoutBannersAttrs> {
  view(vnode: ResultNode<SublayoutBannersAttrs>) {
    const { banner, chain, terms, tosStatus, bannerStatus } = vnode.attrs;

    return (
      <React.Fragment>
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
      </React.Fragment>
    );
  }
}
