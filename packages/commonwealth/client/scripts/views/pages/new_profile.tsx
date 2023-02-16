/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import Sublayout from '../sublayout';
import ProfileComponent from '../components/profile';

export default class NewProfile extends ClassComponent {
  private username: string;

  oninit() {
    this.username = m.route.param('username');
  }

  view() {
    return (
      <Sublayout>
        <ProfileComponent username={this.username} />
      </Sublayout>
    )
  }
}
