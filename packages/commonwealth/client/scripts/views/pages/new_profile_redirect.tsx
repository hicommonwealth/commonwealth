/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import app from 'state';
import { navigateToSubpage } from 'app';
import { NewProfile as Profile } from 'models';
import { PageLoading } from './loading';
import { PageNotFound } from './404';

class NewProfileRedirect extends ClassComponent {
  private profile: Profile;
  private loading: boolean;
  private error: boolean;

  private getLinkedProfile = async (address: string) => {
    this.loading = true;
    try {
      const response = await $.get(`${app.serverUrl()}/profile/v2`, {
        address,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(response.profile);
    } catch (err) {
      this.error = true;
    }
    this.loading = false;
    m.redraw();
  };

  oninit() {
    this.getLinkedProfile(m.route.param('address'));
  }

  view() {
    if (this.loading) {
      return <PageLoading />;
    }

    if (this.error) {
      return <PageNotFound message="We cannot find this profile." />
    }

    if (this.profile) {
      navigateToSubpage(`/profile/${this.profile.username}`);
    }
  }
}

export default NewProfileRedirect;
