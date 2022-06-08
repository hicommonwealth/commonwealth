/* @jsx m */

import m from 'mithril';
import { Button } from 'construct-ui';

import 'components/sidebar/sidebar_quick_switcher.scss';

import app from 'state';
import { link } from 'helpers';
import { ChainInfo } from 'models';
import { ChainIcon } from 'views/components/chain_icon';
import { CommunitySelector } from 'views/components/sidebar/community_selector';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityCreationPayload,
} from 'analytics/types';

import TwitterAttestationModal from '../../modals/twitter_attestation_modal'
import TwitterAttestationModalOld from '../../modals/twitter_attestation_modal_old'


type SidebarQuickSwitcherItemAttrs = {
  item: ChainInfo;
  size: number;
};

class SidebarQuickSwitcherItem
  implements m.ClassComponent<SidebarQuickSwitcherItemAttrs>
{
  view(vnode) {
    const { item, size } = vnode.attrs;

    return (
      <div class="SidebarQuickSwitcherItem" key={`chain-${item.id}`}>
        <ChainIcon
          size={size}
          chain={item}
          onclick={link ? () => m.route.set(`/${item.id}`) : null}
        />
      </div>
    );
  }
}

export class SidebarQuickSwitcher implements m.ClassComponent {

  oncreate() { 
    if (window.location.search) {
      const addresses = app.user.addresses
      const twitterAccount = app.user.socialAccounts.find((acct) => acct.provider === 'twitter')
      const refreshCallback = () => { console.log("REFRESH CALLBACK :)")}

      const query = new URLSearchParams(window.location.search);
      console.log(query)
      if (query.get('continueTwitterAttestation')) {
        app.modals.create({
          modal: TwitterAttestationModal,
          data: { addresses, twitterAccount, refreshCallback },
        });
      }
    }
  }

  view() {
    const allCommunities = app.config.chains
      .getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((item) => !!item.node // only chains with nodes
      );

    const starredCommunities = allCommunities.filter((item) => {
      // filter out non-starred communities
      if (item instanceof ChainInfo && !app.communities.isStarred(item.id))
        return false;
      return true;
    });

    const size = 32;

    return (
      <div class="SidebarQuickSwitcher">
        <div class="community-nav-bar">
          <div onclick={()=>{

              // New
              const addresses = app.user.addresses
              const twitterAccount = app.user.socialAccounts.find((acct) => acct.provider === 'twitter')
              const refreshCallback = () => { console.log("REFRESH CALLBACK :)")}
              app.modals.create({
                modal: TwitterAttestationModal,
                data: { addresses, twitterAccount, refreshCallback },
              });

              // Old
              // const account  = app.user.activeAccount;
              // const twitter = app.user.socialAccounts.find((acct) => acct.provider === 'twitter');
              // app.modals.create({
              //   modal: TwitterAttestationModalOld,
              //   data: { account, twitter, refreshCallback },
              // })

            }}>
            <p>TWIT</p>
          </div>
          <Button
            rounded={true}
            label={<CWIcon iconName="home" iconSize="small" />}
            onclick={(e) => {
              e.preventDefault();
              m.route.set('/');
            }}
          />
          <CommunitySelector />
          {app.isLoggedIn() && (
            <Button
              rounded={true}
              label={<CWIcon iconName="plus" iconSize="small" />}
              onclick={(e) => {
                e.preventDefault();
                mixpanelBrowserTrack({
                  event: MixpanelCommunityCreationEvent.CREATE_BUTTON_PRESSED,
                  chainBase: null,
                  isCustomDomain: app.isCustomDomain(),
                  communityType: null,
                });
                m.route.set('/createCommunity');
              }}
            />
          )}
        </div>
        <div class="scrollable-community-bar">
          {starredCommunities.map((item) => (
            <SidebarQuickSwitcherItem item={item} size={size} />
          ))}
        </div>
      </div>
    );
  }
}
