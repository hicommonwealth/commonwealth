/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import Sublayout from 'views/sublayout';
import NewProfileHeader from './new_profile_header'
import NewProfileActivity from './new_profile_activity'

import { NewProfile as Profile } from '../../../../scripts/models'
import OffchainThread from '../../../../scripts/models/OffchainThread'
import ChainInfo from '../../../../scripts/models/ChainInfo'
import OffchainComment from '../../../../scripts/models/OffchainComment'
import AddressInfo from '../../../../scripts/models/AddressInfo'
import SocialAccount from '../../../../scripts/models/SocialAccount';
import { IUniqueId } from '../../../../scripts/models/interfaces';

import 'pages/new_profile.scss';

type ProfileState = {
  address: string,
  profile: Profile,
  threads: Array<OffchainThread>,
  comments: Array<OffchainComment<IUniqueId>>,
  chains: Array<ChainInfo>,
  addresses: Array<AddressInfo>, 
  socialAccounts: Array<SocialAccount>,
};

class NewProfile implements m.Component<{}, ProfileState> {

  oninit(vnode) {
    vnode.state.address = m.route.param("address")
    this.getProfile(vnode, vnode.state.address)
  }

  getProfile = async (vnode, address: String) => {
    const response = await $.get(`${app.serverUrl()}/profile/v2`, {
      address,
      jwt: app.user.jwt,
    });
    // TODO: status code error handling with better HTTP call library

    vnode.state.profile = Profile.fromJSON(response.profile)    
    vnode.state.threads = response.threads
    vnode.state.comments = response.comments
    vnode.state.chains = response.chains.map(c => ChainInfo.fromJSON(c))
    vnode.state.addresses = response.addresses.map(a => 
      new AddressInfo(a.id, a.address, a.chain, a.keytype, a.is_magic, a.ghost_address))
    vnode.state.socialAccounts = response.socialAccounts.map(a => 
      new SocialAccount(a.provider, a.provider_username))
    m.redraw()
  } 

  view(vnode) {
    return (
      <div className="ProfilePage">
        <NewProfileHeader 
          profile={vnode.state.profile} 
          socialAccounts={vnode.state.socialAccounts}
        />
        <NewProfileActivity 
          threads={vnode.state.threads} 
          comments={vnode.state.comments} 
          chains={vnode.state.chains} 
          addresses={vnode.state.addresses} 
        />
      </div>
    );
  }
}

const NewProfilePage: m.Component = {
  view: () => {
    return m(
      Sublayout,
      {
        class: 'Homepage',
      },
      [m(NewProfile)]
    );
  },
};

export default NewProfilePage;
