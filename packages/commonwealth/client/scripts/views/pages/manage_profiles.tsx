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
import { PageNotFound } from './404';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWButton } from '../components/component_kit/cw_button';

export class ManageProfiles extends ClassComponent {
  private error: boolean;
  private loading: boolean;
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
      this.error = true;
    }
  };

  oninit() {
    this.error = false;
    this.loading = true;
    this.getProfiles();
    this.loading = false;
  }

  view() {
    if (this.loading) return (
      <div class="ManageProfiles full-height">
        <div className="loading-spinner">
          <CWSpinner />
        </div>
      </div>
    );

    if (this.error) return <PageNotFound message="We cannot find any profiles." />

    if (!this.profiles) return;

    return (
      <Sublayout>
        <div class="ManageProfiles">
          <div className="title-container">
            <div>
              <CWText type="h3" className="title">Manage Profiles and Addresses</CWText>
              <CWText className="description">Create and edit profiles and manage your connected addresses.</CWText>
            </div>
            <CWButton
              label="Create Profile"
              iconLeft="plus"
              buttonType="mini-black"
              onclick={() => {
                this.loading = true;
                setTimeout(() => {
                  m.route.set('/profile/new');
                }, 1000);
              }}
            />
          </div>
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
