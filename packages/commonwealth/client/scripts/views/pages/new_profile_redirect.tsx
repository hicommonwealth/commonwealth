import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { getRoute } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';
import $ from 'jquery';

import app from 'state';
import { NewProfile as Profile } from 'models';
import withRouter from 'navigation/helpers';
import { PageLoading } from './loading';
import { PageNotFound } from './404';
import ProfileComponent from '../components/profile';
import EditProfileComponent from '../components/edit_profile';
import Sublayout from '../sublayout';

type NewProfileRedirectAttrs = {
  profileId: string;
};

// TODO: this is a temporary solution to redirect old profile links (using profileId)
// to new profile links (using username). this should be removed once PR4 is merged
class NewProfileRedirect extends ClassComponent<NewProfileRedirectAttrs> {
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
  };

  oninit(vnode: ResultNode<NewProfileRedirectAttrs>) {
    this.getLinkedProfile(vnode.attrs.profileId);
  }

  view(vnode: ResultNode<NewProfileRedirectAttrs>) {
    if (this.loading) {
      return <PageLoading />;
    }

    if (this.error || !this.profile) {
      return <PageNotFound message="We cannot find this profile." />;
    }

    if (this.profile.username) {
      if (getRoute().includes('/edit')) {
        this.setRoute(`/profile/${this.profile.username}/edit`);
      } else {
        this.setRoute(`/profile/${this.profile.username}`);
      }
    }

    if (getRoute().includes('/edit')) {
      return (
        <Sublayout>
          <EditProfileComponent profileId={vnode.attrs.profileId} />
        </Sublayout>
      );
    }

    return (
      <Sublayout>
        <ProfileComponent profileId={vnode.attrs.profileId} />
      </Sublayout>
    );
  }
}

export default withRouter(NewProfileRedirect);
