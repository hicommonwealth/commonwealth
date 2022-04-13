/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import Sublayout from 'views/sublayout';
import NewProfileHeader from './new_profile_header'
import NewProfileActivity from './new_profile_activity'

import Profile from 'client/scripts/models/Profile'
import OffchainThread from 'client/scripts/models/OffchainThread'
import ChainInfo from 'client/scripts/models/ChainInfo'
import OffchainComment from 'client/scripts/models/OffchainComment'
import AddressInfo from 'client/scripts/models/AddressInfo'
import { IUniqueId } from 'client/scripts/models/interfaces';

import 'pages/new_profile.scss';

type ProfileState = {
  address: string,
  profile: Profile,
  threads: Array<OffchainThread>,
  comments: Array<OffchainComment<IUniqueId>>,
  chains: Array<ChainInfo>,
  addresses: Array<AddressInfo>, 
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
    vnode.state.profile = response.profile
    vnode.state.threads = response.threads
    vnode.state.comments = response.comments
    vnode.state.chains = response.chains
    vnode.state.addresses = response.addresses
    vnode.state.socialAccounts = response.socialAccounts
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