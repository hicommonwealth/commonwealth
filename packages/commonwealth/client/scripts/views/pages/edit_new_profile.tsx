/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { navigateToSubpage } from 'router';
import Sublayout from 'views/sublayout';
import EditProfileComponent from '../components/edit_profile';

export default class EditNewProfile extends ClassComponent {
  private username: string;

  oninit() {
    this.username = m.route.param('username');

    if (!app.isLoggedIn()) {
      navigateToSubpage(`/profile/${this.username}`);
    }
  }

  view() {
    return (
      <Sublayout>
        <EditProfileComponent username={this.username} />
      </Sublayout>
    )
  }
}
