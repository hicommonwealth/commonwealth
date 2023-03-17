/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { navigateToSubpage } from 'router';
import Sublayout from 'views/sublayout';
import EditProfileComponent from '../components/edit_profile';

export default class EditNewProfile extends ClassComponent {
  private profileId: string;

  oninit() {
    this.profileId = m.route.param('profileId');

    if (!app.isLoggedIn()) {
      navigateToSubpage(`/profile/id/${this.profileId}`);
    }
  }

  view() {
    return (
      <Sublayout hideFooter={true}>
        <EditProfileComponent profileId={this.profileId} />
      </Sublayout>
    );
  }
}
