import m from 'mithril';
import app from 'state';
import { Button } from 'construct-ui';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { Account, AddressInfo } from 'models';
import { formatAddressShort } from '../../../../../shared/utils';

const ProfileBanner: m.Component<{ account: Account<any>, addressInfo: AddressInfo }, { loading: boolean }> = {
  view: (vnode) => {
    const { account, addressInfo } = vnode.attrs;
    const addrShort = formatAddressShort(addressInfo.address, addressInfo.chain);

    const createRole = async (e) => {
      vnode.state.loading = true;

      const community = app.chain?.meta.chain ? app.chain.meta.chain.name
        : app.community?.meta ? app.community.meta.name : 'current';
      const confirmed = await confirmationModalWithText(
        `Join the ${community} community with this address (${addrShort})?`
      )();
      if (!confirmed) {
        vnode.state.loading = false;
        m.redraw();
        return;
      }

      app.user.createRole({
        address: addressInfo,
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
      }).then(() => {
        vnode.state.loading = false;
        m.redraw();
        notifySuccess(`Joined with ${addrShort}`);
        setActiveAccount(account).then(() => {
          m.redraw();
          $(e.target).trigger('modalexit');
        });
      }).catch((err: any) => {
        vnode.state.loading = false;
        m.redraw();
        notifyError(err.responseJSON.error);
      });
    };

    return m('.ProfileBanner', [
      m('.banner-text', [
        `You are already logged in with this address (${addrShort})`,
      ]),
      m(Button, {
        label: 'Join community',
        intent: 'primary',
        disabled: vnode.state.loading,
        onclick: createRole.bind(this),
      })
    ]);
  }
};

export default ProfileBanner;
