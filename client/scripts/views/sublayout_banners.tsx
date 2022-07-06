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
};

export class SublayoutBanners
  implements m.ClassComponent<SublayoutBannersAttrs>
{
  view(vnode) {
    const { banner, chain, terms, tosStatus } = vnode.attrs;

    return (
      <>
        {isNonEmptyString(banner.trim()) && ( // probably shouldn't have to trim this to check it...
          <CWMessageBanner
            bannerContent={banner}
            onClose={() => console.log('off')}
          />
        )}
        {app.isLoggedIn() &&
          ITokenAdapter.instanceOf(app.chain) &&
          !app.user.activeAccount && (
            <CWBanner
              bannerContent={`Link an address that holds ${chain.symbol} to participate in governance.`}
            />
          )}
        {isNonEmptyString(terms) && tosStatus !== 'off' && (
          <TermsBanner terms={terms} />
        )}
      </>
    );
  }
}
