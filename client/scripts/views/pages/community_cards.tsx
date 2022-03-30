/* @jsx m */

import m from 'mithril';
import numeral from 'numeral';

import 'pages/landing/community_cards.scss';

import app from 'state';
import { ChainInfo, NodeInfo } from 'models';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCard } from '../components/component_kit/cw_card';
import Sublayout from '../sublayout';

const buildCommunityString = (numCommunities: number) => {
  let numberString = numCommunities;
  if (numCommunities >= 1000) {
    numberString = numeral(numCommunities).format('0.0a');
  }
  return `${numberString} Communities`;
};

type ChainCardAttrs = { chain: string; nodeList: NodeInfo[] };

class ChainCard implements m.ClassComponent<ChainCardAttrs> {
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
        className="chain-card"
        onclick={redirectFunction}
      >
        <div class="card-header">
          {iconUrl ? (
            <img class="chain-icon" src={iconUrl} />
          ) : (
            <div class="chain-icon no-image" />
          )}
        </div>
        <div class="card-body">
          <div class="community-name" lang="en">
            {chainInfo.name}
          </div>
          <div class="card-description" title={prettyDescription} lang="en">
            {prettyDescription}
          </div>
          <div class="join-button-wrapper">
            <CWButton
              buttonType="secondary"
              label="See More"
              onclick={redirectFunction}
            />
          </div>
        </div>
      </CWCard>
    );
  }
}

type CommunityCardAttrs = { community: ChainInfo };

class CommunityCard implements m.ClassComponent<CommunityCardAttrs> {
  view(vnode) {
    const { community } = vnode.attrs;

    const redirectFunction = (e) => {
      e.preventDefault();
      localStorage['home-scrollY'] = window.scrollY;
      m.route.set(`/${community.id}`);
    };

    let prettyDescription = '';
    if (community.description) {
      prettyDescription =
        community.description[community.description.length - 1] === '.'
          ? community.description
          : `${community.description}.`;
    }

    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="chain-card"
        onclick={redirectFunction}
      >
        <div class="card-header">
          {community.iconUrl ? (
            <img class="chain-icon" src={community.iconUrl} />
          ) : (
            <div class="chain-icon no-image" />
          )}
        </div>
        <div class="card-body">
          <div class="community-name" lang="en">
            {community.name}
          </div>
          <div class="card-description" title={prettyDescription} lang="en">
            {prettyDescription}
          </div>
          <div class="join-button-wrapper">
            <CWButton
              buttonType="secondary"
              disabled={false}
              label="See More"
              onclick={redirectFunction}
            />
          </div>
        </div>
      </CWCard>
    );
  }
}

class HomepageCommunityCards implements m.ClassComponent {
  view() {
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
      }
    });

    const myChains: any = Object.entries(chains);

    const sortChainsAndCommunities = (list) =>
      list
        .sort((a, b) => {
          const threadCountA = app.recentActivity.getCommunityThreadCount(
            Array.isArray(a) ? a[0] : a.id
          );
          const threadCountB = app.recentActivity.getCommunityThreadCount(
            Array.isArray(b) ? b[0] : b.id
          );
          return threadCountB - threadCountA;
        })
        .map((entity) => {
          if (Array.isArray(entity)) {
            const [chain, nodeList]: [string, any] = entity as any;
            return m(ChainCard, { chain, nodeList });
          } else if (entity.id) {
            return m(CommunityCard, { community: entity });
          }
          return null;
        });

    const sortedChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage)
    );
    const betaChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && c[1][0].chain.collapsedOnHomepage)
    );

    const totalCommunitiesString = buildCommunityString(
      sortedChainsAndCommunities.length + betaChainsAndCommunities.length
    );

    return (
      <div class="HomepageCommunityCards">
        <div class="communities-header">{totalCommunitiesString}</div>
        <div class="communities-list">{sortedChainsAndCommunities}</div>
        <div class="communities-header">
          {betaChainsAndCommunities.length > 0 && (
            <h4>Testnets & Alpha Networks</h4>
          )}
        </div>
        <div class="communities-list">
          {betaChainsAndCommunities}
          <CWCard
            elevation="elevation-2"
            interactive={true}
            className="chain-card"
            onclick={(e) => {
              e.preventDefault();
              document.location =
                'https://hicommonwealth.typeform.com/to/cRP27Rp5' as any;
            }}
          >
            <div class="new-community-card-body">
              <h3>Create a new community</h3>
              <p class="action">
                Launch and grow your decentralized community on Commonwealth
              </p>
              <a class="learn-more" href="#">
                {m.trust('Learn more &raquo;')}
              </a>
            </div>
          </CWCard>
        </div>
      </div>
    );
  }
}

const CommunityCardPage: m.Component = {
  view: () => {
    return m(
      Sublayout,
      {
        class: 'Homepage',
      },
      [m(HomepageCommunityCards)]
    );
  },
};

export default CommunityCardPage;
