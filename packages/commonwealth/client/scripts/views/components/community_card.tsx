/* @jsx m */

import m from 'mithril';

import 'components/community_card.scss';

import { ChainInfo } from 'models';
import { CWButton } from './component_kit/cw_button';
import { CWCard } from './component_kit/cw_card';
import { CWIconButton } from './component_kit/cw_icon_button';
import { CWText } from './component_kit/cw_text';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';

type CommunityCardAttrs = { chain: ChainInfo };

export class CommunityCard implements m.ClassComponent<CommunityCardAttrs> {
  view(vnode) {
    const { chain } = vnode.attrs as CommunityCardAttrs;

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${chain.id}`);
    };

    // Potentially Temporary (could be built into create community flow)
    let prettyDescription = '';

    if (chain.description) {
      prettyDescription =
        chain.description[chain.description.length - 1] === '.'
          ? chain.description
          : `${chain.description}.`;
    }

    return (
      <CWCard
        elevation="elevation-2"
        interactive
        className="community-card"
        onclick={redirectFunction}
      >
        <div class="top-content">
          <CWCommunityAvatar community={chain} size="xxl" />
          <CWText
            type="h4"
            fontWeight="semiBold"
            className="chain-name"
            title={chain.name}
            noWrap
          >
            {chain.name}
          </CWText>
        </div>
        <div class="bottom-content">
          <CWText
            className="card-description"
            type="caption"
            title={prettyDescription}
          >
            {prettyDescription}
          </CWText>
          <CWButton
            buttonType="secondary-black"
            label="See More"
            onclick={redirectFunction}
          />
          {/* for mobile */}
          <CWIconButton iconName="expand" onclick={redirectFunction} />
        </div>
      </CWCard>
    );
  }
}

export class NewCommunityCard implements m.ClassComponent {
  view() {
    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="new-community-card"
        onclick={(e) => {
          e.preventDefault();
          document.location =
            'https://hicommonwealth.typeform.com/to/cRP27Rp5' as any;
        }}
      >
        <div class="new-community-card-body">
          <CWText
            type="h3"
            fontWeight="semiBold"
            className="new-community-header"
          >
            Create a new community
          </CWText>
          <CWText className="new-community">
            Launch and grow your decentralized community on Commonwealth
          </CWText>
          <a class="learn-more" href="#">
            Learn more
          </a>
        </div>
      </CWCard>
    );
  }
}
