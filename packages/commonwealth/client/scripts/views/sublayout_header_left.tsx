/* @jsx m */

import m from 'mithril';

import 'sublayout_header_left.scss';

import app from 'state';
import { link } from 'helpers';
import { isNotNil, isNotUndefined, isUndefined } from 'helpers/typeGuards';
import { ChainInfo } from 'models';
import { CommunityOptionsPopover } from './components/community_options_popover';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';

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
            {/* <CWCommunityAvatar size="medium" community={chain} />
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
            <CommunityOptionsPopover /> */}
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
