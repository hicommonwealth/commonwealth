import m from 'mithril';
import app from 'state';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import type { Account, AddressInfo } from 'models';
import { formatAddressShort } from '../../../../../shared/utils';
import { CWButton } from '../../components/component_kit/cw_button';

const ProfileBanner: m.Component<
  { account: Account; addressInfo: AddressInfo },
  { loading: boolean }
> = {
  view: (vnode) => {
    const { account, addressInfo } = vnode.attrs;
    const addrShort = formatAddressShort(
      addressInfo.address,
      addressInfo.chain.id
    );

    const createRole = async (e) => {
      vnode.state.loading = true;

      const community = app.chain?.meta ? app.chain.meta.name : 'current';
      const confirmed = await confirmationModalWithText(
        `Join the ${community} community with this address?`
      )();
      if (!confirmed) {
        vnode.state.loading = false;
        m.redraw();
        return;
      }

      app.roles
        .createRole({
          address: addressInfo,
          chain: app.activeChainId(),
        })
        .then(() => {
          vnode.state.loading = false;
          m.redraw();
          notifySuccess(`Joined with ${addrShort}`); // ${addrShort} is now a member of the [Edgeware] community!
          setActiveAccount(account).then(() => {
            m.redraw();
            $(e.target).trigger('modalexit');
          });
        })
        .catch((err: any) => {
          vnode.state.loading = false;
          m.redraw();
          notifyError(err.responseJSON.error);
        });
    };

    return m('.ProfileBanner', [
      m('.banner-text', [
        'You are already logged in with this address', // but have not joined the [Edgeware] community
      ]),
      m(CWButton, {
        label: 'Join community',
        disabled: vnode.state.loading,
        onclick: createRole.bind(this),
      }),
    ]);
  },
};

export default ProfileBanner;
