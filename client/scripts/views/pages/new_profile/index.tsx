/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import Sublayout from 'views/sublayout';
import NewProfileHeader from './new_profile_header'
import NewProfileActivity from './new_profile_activity'
import { Spinner } from 'construct-ui';

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
  loading: boolean,
  error: ProfileError,
}

enum ProfileError {
  None, 
  NoAddressFound,
  NoProfileFound,
  InsufficientProfileData,
} 

const NoAddressFoundError = "No address found"
const NoProfileFoundError = "No profile found"

const requiredProfileData = ['name', 'avatarUrl', 'bio']

class NewProfile implements m.Component<{}, ProfileState> {

  oninit(vnode) {
    vnode.state.address = m.route.param("address")
    vnode.state.loading = true
    vnode.state.error = ProfileError.None
    this.getProfile(vnode, vnode.state.address)
    
    // TODO: Insufficient data cases for owning user and visiting user
    const sufficientProfileData = requiredProfileData.every(field => 
      field in vnode.state.profile && vnode.state.profile[field]
    )
    if (!sufficientProfileData) {
      if (app.isLoggedIn() && 
        app.user.addresses.map(addressInfo => addressInfo.address).includes(vnode.state.address)) {

      }
      vnode.state.error = ProfileError.InsufficientProfileData
    }
  }

  getProfile = async (vnode, address: String) => {
    const response = await $.get(`${app.serverUrl()}/profile/v2`, {
      address,
      jwt: app.user.jwt,
    }).catch((err) => {
      if (err.status == 500 && err.responseJSON.error == NoAddressFoundError) {
        vnode.state.error = ProfileError.NoAddressFound
      }
      if (err.status == 500 && err.responseJSON.error == NoProfileFoundError) {
        vnode.state.error = ProfileError.NoProfileFound
      }
      vnode.state.loading = false
      m.redraw()
    });
    if (vnode.state.error != ProfileError.None) return

    vnode.state.loading = false
    vnode.state.profile = Profile.fromJSON(response.profile)    
    vnode.state.threads = response.threads
    vnode.state.comments = response.comments.map(c => OffchainComment.fromJSON(c))
    vnode.state.chains = response.chains.map(c => ChainInfo.fromJSON(c))
    vnode.state.addresses = response.addresses.map(a => 
      new AddressInfo(a.id, a.address, a.chain, a.keytype, a.is_magic, a.ghost_address))
    vnode.state.socialAccounts = response.socialAccounts.map(a => 
      new SocialAccount(a.provider, a.provider_username))
    m.redraw()
  } 

  view(vnode) {

    if (vnode.state.loading)
      return (
        <div className="ProfilePage">
          <div className="loading-spinner">
            <Spinner active={true} size="lg" />
          </div>
        </div>
      )

    if (vnode.state.error === ProfileError.None) 
      return (
        <div className="ProfilePage">
          <NewProfileHeader 
            address={vnode.state.address}
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
      )

    if (vnode.state.error === ProfileError.NoAddressFound)
      return (
        <div className="ProfilePage">
          <div className="ErrorPage">
            <h3> Not on Commonwealth </h3>
            <p> If this is your address, sign in using your wallet to set up a profile. </p>
          </div>
        </div>
      )

    if (vnode.state.error === ProfileError.NoProfileFound)
      return (
        <div className="ProfilePage">
          <div className="ErrorPage">
            <h3> No Profile Found </h3>
            <p> This address is not registered to Commonwealth. </p>
          </div>
        </div>
      )

    if (vnode.state.error === ProfileError.InsufficientProfileData)
      return (
        <div className="ProfilePage">
          <div className="ErrorPage">
            <h3> Profile Pending </h3>
            <p> The profile for this address has not been set up yet. </p>
          </div>
        </div>
      )
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
