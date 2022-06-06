/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWBanner } from './components/component_kit/cw_banner';
import { ChainInfo, ITokenAdapter } from '../models';
import { isNonEmptyString } from '../helpers/typeGuards';
import { CWText } from './components/component_kit/cw_text';

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
        {app.isLoggedIn() &&
          ITokenAdapter.instanceOf(app.chain) &&
          !app.user.activeAccount && (
            <CWBanner
              bannerContent={`Link an address that holds ${chain.symbol} to participate in governance.`}
            />
          )}
        {isNonEmptyString(terms) && tosStatus !== 'off' && (
          <CWBanner
            bannerContent={
              <CWText type="caption">
                <a href={terms}>
                  Please read the terms and conditions before interacting with
                  this community.
                </a>
              </CWText>
            }
            onClose={() =>
              localStorage.setItem(`${app.activeChainId()}-tos`, 'off')
            }
          />
        )}
        <CWBanner bannerContent={banner} />
      </>
    );
  }
}
