import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Magic } from 'magic-sdk';
import { PolkadotExtension } from '@magic-ext/polkadot';
import { MAGIC_PUBLISHABLE_KEY } from 'utils';

import PageLoading from './loading';
import ErrorPage from './error';

const finishLogin = async (vnode: m.Vnode<{}, { started: boolean, error?: string }>) => {
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
      { didToken, redirectDeeplink: 'exp://expo.io/@10x/commonwealth-rn' },
    );
  } catch (e) {
    console.error(e);
    vnode.state.error = e.message;
  }
};

const FinishMagicLogin: m.Component<{}, { started: boolean, error?: string }> = {
  view: (vnode) => {
    if (!vnode.state.started) {
      vnode.state.started = true;
      finishLogin(vnode);
    }
    if (!vnode.state.error) {
      return m(PageLoading);
    } else {
      return m(ErrorPage, { message: vnode.state.error, title: 'Login Error' });
    }
  }
};

export default FinishMagicLogin;
