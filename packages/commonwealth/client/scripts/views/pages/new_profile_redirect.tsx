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

type NewProfileRedirectAttrs = {
  address: string;
}

// TODO: this is a temporary solution to redirect old profile links (using address)
// to new profile links (using username). this should be removed once PR4 is merged
class NewProfileRedirect extends ClassComponent<NewProfileRedirectAttrs> {
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
  };

  oninit(vnode: ResultNode<NewProfileRedirectAttrs>) {
    this.getLinkedProfile(vnode.attrs.address);
  }

  view() {
    if (this.loading) {
      return <PageLoading />;
    }

    if (this.error) {
      return <PageNotFound message="We cannot find this profile." />;
    }

    if (this.profile) {
      if (getRoute().includes('/edit')) {
        this.setRoute(`/profile/${this.profile.username}/edit`);
      } else {
        this.setRoute(`/profile/${this.profile.username}`);
      }
    }
  }
}

export default withRouter(NewProfileRedirect);
