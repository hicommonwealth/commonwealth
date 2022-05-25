/* @jsx m */

import m from 'mithril';

import 'components/community_card.scss';

import app from 'state';
import { NodeInfo } from 'models';
import { CWButton } from './component_kit/cw_button';
import { CWCard } from './component_kit/cw_card';
import { CWIconButton } from './component_kit/cw_icon_button';
import { CWText } from './component_kit/cw_text';

type CommunityCardAttrs = { chain: string; nodeList: NodeInfo[] };

export class CommunityCard implements m.ClassComponent<CommunityCardAttrs> {
  view(vnode) {
    const { chain, nodeList } = vnode.attrs;

    const chainInfo = app.config.chains.getById(chain);

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${chain}`);
    };

    // Potentially Temporary (could be built into create community flow)
    let prettyDescription = '';

    if (chainInfo.description) {
      prettyDescription =
        chainInfo.description[chainInfo.description.length - 1] === '.'
          ? chainInfo.description
          : `${chainInfo.description}.`;
    }

    const iconUrl =
      nodeList[0].chain.iconUrl || (nodeList[0].chain as any).icon_url;

    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="community-card"
        onclick={redirectFunction}
      >
        {iconUrl ? (
          <img class="large-chain-icon" src={iconUrl} />
        ) : (
          <div class="large-chain-icon no-image">
            <CWText type="h2" fontWeight="bold" className="no-image-text">
              {chainInfo.name.slice(0, 1)}
            </CWText>
          </div>
        )}
        <div class="card-body">
          <CWText
            type="h3"
            fontWeight="semiBold"
            className="chain-name"
            title={chainInfo.name}
            noWrap
          >
            {chainInfo.name}
          </CWText>
          <CWText className="card-description" title={prettyDescription}>
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
