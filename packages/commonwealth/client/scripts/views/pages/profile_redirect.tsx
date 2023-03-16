/* @jsx m */

import ClassComponent from 'class_component';
import $ from 'jquery';
import m from 'mithril';

import app from 'state';
import { PageLoading } from './loading';
import { PageNotFound } from './404';

class ProfileRedirect extends ClassComponent {
  private profileId: number;
  private loading: boolean;
  private error: boolean;

  private async getProfileId(address, chain) {
    this.loading = true;
    try {
      const res = await $.post(`${app.serverUrl()}/getAddressProfile`, {
        address,
        chain,
      });
      if (res.status === 'Success' && res.result) {
        this.profileId = res.result.profileId;
      }
    } catch (err) {
      this.error = true;
    }
    this.loading = false;
    m.redraw();
  }

  oninit() {
    this.profileId = null;
    this.loading = false;
    this.error = false;
  }

  view(vnode) {
    if (this.loading) {
      return <PageLoading />;
    }

    if (this.error) {
      return (
        <PageNotFound message="There was an error loading this profile." />
      );
    }

    let { address, scope } = vnode.attrs;
    if (!address) address = app.user.activeAddressAccount?.address;
    if (!scope) scope = app.activeChainId();

    if (address && scope && !this.profileId) this.getProfileId(address, scope);

    if (this.profileId) {
      m.route.set(`/profile/id/${this.profileId}`);
    }
  }
}

export default ProfileRedirect;
