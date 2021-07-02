import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Magic } from 'magic-sdk';
import { PolkadotExtension } from '@magic-ext/polkadot';
import { MAGIC_PUBLISHABLE_KEY } from 'utils';
import { Button } from 'construct-ui';

import PageLoading from './loading';
import ErrorPage from './error';

interface IFinishLoginState {
  started: boolean;
  error?: string;
  redirectUrl?: string;
}

const finishLogin = async (vnode: m.Vnode<{}, IFinishLoginState>) => {
  const magic = new Magic(MAGIC_PUBLISHABLE_KEY, { extensions: [
    new PolkadotExtension({
      // we don't need a real node URL because we're only generating an address,
      // not doing anything requiring chain connection
      rpcUrl: 'ws://localhost:9944',
    })
  ] });

  try {
    const didToken = await magic.auth.loginWithCredential();
    const response = await $.getJSON(
      `${app.serverUrl()}/mobileLoginRedirect`,
      { didToken, redirectDeeplink: 'exp://exp.host/@10x/commonwealth-rn' },
    );
    vnode.state.redirectUrl = response?.result.redirectUrl;
  } catch (e) {
    console.error(e);
    vnode.state.error = e.message;
  }
};

const FinishMagicLogin: m.Component<{}, IFinishLoginState> = {
  view: (vnode) => {
    if (!vnode.state.started) {
      vnode.state.started = true;
      finishLogin(vnode);
    }
    if (vnode.state.error) {
      return m(ErrorPage, { message: vnode.state.error, title: 'Login Error' });
    } else {
      if (!vnode.state.redirectUrl) {
        return m(PageLoading);
      } else {
        return m(Button, {
          rounded: true,
          onclick: (e) => {
            e.preventDefault();
            window.location.replace(vnode.state.redirectUrl);
          },
          label: 'Redirect to app...',
        });
      }
    }
  }
};

export default FinishMagicLogin;
