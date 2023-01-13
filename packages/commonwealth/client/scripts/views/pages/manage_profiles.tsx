/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import 'pages/manage_profiles.scss';

import app from 'state';
import { AddressInfo, NewProfile as Profile } from 'models';
import { CWText } from '../components/component_kit/cw_text';
import Sublayout from '../sublayout';
import { ProfilePreview } from '../components/profile_preview';

export class ManageProfiles extends ClassComponent {
  private profiles: Profile[];
  private addresses: AddressInfo[];

  private getProfiles = async () => {
    try {
      const response = await $.post(`${app.serverUrl()}/newProfiles`, {
        jwt: app.user.jwt,
      });

      this.profiles = response.result.profiles.map((profile) => new Profile(profile));
      this.addresses = response.result.addresses.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address,
            a.profile_id,
          )
      );
    } catch (err) {
      console.log('ERROR in call', err);
    }
  };

  oninit() {
    this.getProfiles();
  }

  view() {
    if (!this.profiles) return;

    return (
      <Sublayout>
        <div class="ManageProfiles">
          <CWText type="h3" className="title">Manage Profiles and Addresses</CWText>
          <CWText className="description">Create and edit profiles and manage your connected addresses.</CWText>
          {this.profiles.map((profile) => (
            <ProfilePreview
              profiles={this.profiles}
              profile={profile}
              addresses={this.addresses.filter((a) => a.profileId === profile.id)}
            />
          ))}
        </div>
      </Sublayout>
    );
  }
}

export default ManageProfiles;
