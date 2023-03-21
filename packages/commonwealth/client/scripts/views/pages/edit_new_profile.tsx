/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import Sublayout from 'views/sublayout';
import EditProfileComponent from '../components/edit_profile';
import { PageNotFound } from '../pages/404';

export default class EditNewProfile extends ClassComponent {
  view() {
    if (!app.isLoggedIn())
      return (
        <PageNotFound message="You must be logged in to edit your profile." />
      );

    return (
      <Sublayout hideFooter={true}>
        <EditProfileComponent />
      </Sublayout>
    );
  }
}
