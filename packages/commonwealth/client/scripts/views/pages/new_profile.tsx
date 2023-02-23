/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import ProfileComponent from '../components/profile';

export default class NewProfile extends ClassComponent {
  private profileId: string;

  oninit() {
    this.profileId = m.route.param('profileId');
  }

  view() {
    return <ProfileComponent profileId={this.profileId} />;
  }
}
