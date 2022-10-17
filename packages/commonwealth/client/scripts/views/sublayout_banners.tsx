/* @jsx m */

import m from 'mithril';

import app from 'state';
import {
  CWBanner,
  CWMessageBanner,
} from './components/component_kit/cw_banner';
import { ChainInfo, ITokenAdapter } from '../models';
import { isNonEmptyString } from '../helpers/typeGuards';
import { TermsBanner } from './components/terms_banner';

type SublayoutBannersAttrs = {
  banner?: string;
  chain: ChainInfo;
  terms?: string;
  tosStatus?: string;
  bannerStatus?: string;
};

export class SublayoutBanners
  implements m.ClassComponent<SublayoutBannersAttrs>
{
  view(vnode) {
    const { banner, chain, terms, tosStatus, bannerStatus } = vnode.attrs;

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
  }
}
