/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import 'pages/manage_profiles.scss';

import app from 'state';
import { NewProfile as Profile } from 'models';
import { CWText } from '../components/component_kit/cw_text';
import Sublayout from '../sublayout';
import { ProfilePreview } from '../components/profile_preview';

export class ManageProfiles extends ClassComponent<{}> {
  private profiles: Profile[];

  private getProfiles = async () => {
    try {
      const response = await $.post(`${app.serverUrl()}/newProfiles`);
      console.log('response', response);
      this.profiles = response.result.profiles.map((p) => new Profile(p));
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
          {this.profiles.map((profile) => <ProfilePreview profile={profile} />)}
        </div>
      </Sublayout>
    );
  }
}

export default ManageProfiles;
