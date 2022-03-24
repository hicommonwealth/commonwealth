/* @jsx m */

import m from 'mithril';

import 'sublayout.scss';

import app from 'state';
import { link } from 'helpers';
import { ChainIcon } from 'views/components/chain_icon';
import { isNotNil, isNotUndefined, isUndefined } from 'helpers/typeGuards';
import { ChainInfo } from 'client/scripts/models';
import { CommunityOptionsPopover } from './community_options_popover';

type SublayoutHeaderLeftAttrs = {
  alwaysShowTitle?: boolean;
  chain: ChainInfo;
  title?: any;
};

export class SublayoutHeaderLeft
  implements m.ClassComponent<SublayoutHeaderLeftAttrs>
{
  view(vnode) {
    const { alwaysShowTitle, chain, title } = vnode.attrs;

    const hasDefaultHeader =
      isUndefined(app.activeChainId()) &&
      !app.isCustomDomain() &&
      (m.route.get() === '/' || m.route.get().startsWith('/?'));

    const headerLeftContent = () => {
      if (hasDefaultHeader) {
        return <h3>Commonwealth</h3>;
      } else if (isNotNil(chain)) {
        return (
          <div class="inner-heading-container">
            <div class="ChainIcon">
              {link(
                'a',
                !app.isCustomDomain() ? `/${app.activeChainId()}` : '/',
                <ChainIcon size={22} chain={chain} />
              )}
            </div>
            <h4 class="sublayout-header-heading">
              {link(
                'a',
                app.isCustomDomain() ? '/' : `/${app.activeChainId()}`,
                chain.name
              )}
              {isNotUndefined(title) && (
                <span class="breadcrumb">{m.trust('/')}</span>
              )}
              {title}
              {m(CommunityOptionsPopover)}
            </h4>
          </div>
        );
      } else if (alwaysShowTitle) {
        return (
          <h4 class="sublayout-header-heading no-chain-or-community">
            {title}
          </h4>
        );
      } else {
        return null;
      }
    };

    return <div class="sublayout-header-left">{headerLeftContent()}</div>;
  }
}
