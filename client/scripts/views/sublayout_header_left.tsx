/* @jsx m */

import m from 'mithril';

import 'sublayout_header_left.scss';

import app from 'state';
import { link } from 'helpers';
import { ChainIcon } from 'views/components/chain_icon';
import { isNotNil, isNotUndefined, isUndefined } from 'helpers/typeGuards';
import { ChainInfo } from 'client/scripts/models';
import { CommunityOptionsPopover } from './components/community_options_popover';

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
        return <h4>Commonwealth</h4>;
      } else if (isNotNil(chain)) {
        return (
          <>
            {link(
              'a',
              !app.isCustomDomain() ? `/${app.activeChainId()}` : '/',
              <ChainIcon size={22} chain={chain} />
            )}
            <h4>
              {link(
                'a',
                app.isCustomDomain() ? '/' : `/${app.activeChainId()}`,
                chain.name
              )}
              {isNotUndefined(title) && (
                <span class="slash">{m.trust('/')}</span>
              )}
              {title}
            </h4>
            <CommunityOptionsPopover />
          </>
        );
      } else if (alwaysShowTitle) {
        return <h4>{title}</h4>;
      } else {
        return null;
      }
    };

    return <div class="SublayoutHeaderLeft">{headerLeftContent()}</div>;
  }
}
