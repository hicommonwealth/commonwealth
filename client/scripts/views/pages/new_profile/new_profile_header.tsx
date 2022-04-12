/* @jsx m */

import m from 'mithril';

import Profile from 'client/scripts/models/Profile'

import { CWCard } from '../../components/component_kit/cw_card';
import { CWAccount } from '../../components/component_kit/cw_icons/cw_icons';

import 'pages/new_profile.scss';

type ProfileHeaderAttrs = {
  profile: Profile,
};

const NewProfileHeader : m.Component<ProfileHeaderAttrs> = {
  view(vnode) {
    const { profile } = vnode.attrs;
    return(
      <div className="ProfileHeader">
        <div className="profile-image"> 
            { /* profile image */ }
        </div>

        <CWCard
          interactive={true}
          fullWidth={true}
          className="profile-content"
        > 
          <div className="section profile-name">
            <CWAccount className="profile-icon" iconName="account" iconSize="medium" />
            <h3> { profile?.profile_name } </h3>
          </div>
          
          <div className="section">
            <p> { profile?.bio } </p>
          </div>

          <div className="section">
            <a> { profile?.website } </a>
          </div>
        </CWCard>
      </div>
    )
  }
}

export default NewProfileHeader;