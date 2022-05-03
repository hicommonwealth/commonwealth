/* @jsx m */

import m from 'mithril';

import 'components/community_label.scss';

import { ChainInfo } from 'models';
import { ChainIcon, TokenIcon } from 'views/components/chain_icon';
import { ChainStatusIndicator } from 'views/components/chain_status_indicator';
import { isNotUndefined } from 'helpers/typeGuards';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

type CommunityLabelAttrs = {
  chain?: ChainInfo;
  hasLink?: boolean;
  showStatus?: boolean;
  size?: number;
  token?: any;
};

const getCommunityNameIcon = (chain: ChainInfo, token: any) => {
  if (isNotUndefined(chain)) {
    return <ChainStatusIndicator hideLabel={true} />;
  } else if (token.privacyEnabled) {
    return <CWIcon iconName="lock" size="small" />;
  } else {
    <CWIcon iconName="website" size="small" />;
  }
};

export class CommunityLabel implements m.ClassComponent<CommunityLabelAttrs> {
  view(vnode) {
    const { chain, hasLink, showStatus, size = 18, token } = vnode.attrs;

    if (isNotUndefined(chain) || isNotUndefined(token))
      return (
        <div class="CommunityLabel">
          {chain ? (
            <ChainIcon
              size={size}
              chain={chain}
              onclick={hasLink ? () => m.route.set(`/${chain.id}`) : null}
            />
          ) : (
            <TokenIcon
              size={size}
              token={token}
              onclick={hasLink ? () => m.route.set(`/${token.id}`) : null}
            />
          )}
          <div
            class="community-label-name"
            title={chain ? chain.name : token.name}
          >
            {chain ? chain.name : token.name}
          </div>
          {showStatus && getCommunityNameIcon(chain, token)}
        </div>
      );

    // what's going on here, and why?
    return (
      <div class="CommunityLabel.CommunityLabelPlaceholder">
        <div class="visible-sm">Commonwealth</div>
      </div>
    );
  }
}
