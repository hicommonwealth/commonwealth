import { setActiveAccount } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { Account, AddressInfo } from 'models';
import app from 'state';
import { render, redraw, Component } from 'mithrilInterop';

import { formatAddressShort } from '../../../../../shared/utils';
import { CWButton } from '../../components/component_kit/cw_button';

const ProfileBanner: Component<
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
      const confirmed = window.confirm(
        `Join the ${community} community with this address?`
      );
      if (!confirmed) {
        vnode.state.loading = false;
        redraw();
        return;
      }

      app.roles
        .createRole({
          address: addressInfo,
          chain: app.activeChainId(),
        })
        .then(() => {
          vnode.state.loading = false;
          redraw();
          notifySuccess(`Joined with ${addrShort}`); // ${addrShort} is now a member of the [Edgeware] community!
          setActiveAccount(account).then(() => {
            redraw();
            $(e.target).trigger('modalexit');
          });
        })
        .catch((err: any) => {
          vnode.state.loading = false;
          redraw();
          notifyError(err.responseJSON.error);
        });
    };

    return render('.ProfileBanner', [
      render('.banner-text', [
        'You are already logged in with this address', // but have not joined the [Edgeware] community
      ]),
      render(CWButton, {
        label: 'Join community',
        disabled: vnode.state.loading,
        onClick: createRole.bind(this),
      }),
    ]);
  },
};

export default ProfileBanner;
