/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import app from 'state';
import { NewProfile as Profile } from 'models';
import { navigateToSubpage } from 'router';
import { PageLoading } from './loading';
import { PageNotFound } from './404';
import ProfileComponent from '../components/profile';
import EditProfileComponent from '../components/edit_profile';
import Sublayout from '../sublayout';

// TODO: this is a temporary solution to redirect old profile links (using profileId)
// to new profile links (using username). this should be removed once PR4 is merged
class NewProfileRedirect extends ClassComponent {
  private profile: Profile;
  private loading: boolean;
  private error: boolean;

  private getLinkedProfile = async (profileId: string) => {
    this.loading = true;
    try {
      const { result } = await $.get(`${app.serverUrl()}/profile/v2`, {
        profileId,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(result.profile);
    } catch (err) {
      this.error = true;
    }
    this.loading = false;
    m.redraw();
  };

  oninit() {
    this.getLinkedProfile(m.route.param('profileId'));
  }

  view() {
    if (this.loading) {
      return <PageLoading />;
    }

    if (this.error) {
      return <PageNotFound message="We cannot find this profile." />;
    }

    if (this.profile.username) {
      if (m.route.get().includes('/edit')) {
        navigateToSubpage(`/profile/${this.profile.username}/edit`);
      } else {
        navigateToSubpage(`/profile/${this.profile.username}`);
      }
    }

    if (m.route.get().includes('/edit')) {
      return (
        <Sublayout>
          <EditProfileComponent profileId={m.route.param('profileId')} />
        </Sublayout>
      );
    }

    return (
      <Sublayout>
        <ProfileComponent profileId={m.route.param('profileId')} />
      </Sublayout>
    );
  }
}

export default NewProfileRedirect;
