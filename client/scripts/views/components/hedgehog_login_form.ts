import 'components/hedgehog_login_form.scss';

import axios from 'axios';
import { default as $ } from 'jquery';
import { default as m } from 'mithril';
import { default as app } from 'state';
import { createUserWithAddress } from 'controllers/app/login';
import { EthereumAccount } from 'client/scripts/controllers/chain/ethereum/account';

const messages = {
  // signedIn: {
  //   header: `You're Signed In!`,
  //   body: `You just created an encrypted Ethereum address using Hedgehog! ` +
  //    `You can access it again using the same credentials. ` +
  //    `Note that if you forget your password, it *cannot* be recovered!,
  // },
  // signedOut: {
  //   header: `You're Not Signed In`,
  //   body: `You're currently signed out`,
  //   instructions: `Enter a username and password to create a new Ethereum address.`
  // },
  // invalid: `Incorrect username or password. Try again.`,
  empty: 'Please enter a username and password.',
  exists: 'Account already exists, please try logging in.',
  // mismatched: `The passwords you entered don't match.`
};

const requestToServer = async (axiosRequestObj) => {
  axiosRequestObj.baseURL = app.serverUrl();
  try {
    const resp = await axios(axiosRequestObj);
    if (resp.status === 200) {
      return resp.data;
    } else {
      // tslint:disable-next-line:no-string-literal
      throw new Error(resp.data['error']);
    }
  } catch (e) {
    // tslint:disable-next-line:no-string-literal
    throw new Error(e.response.data['error']);
  }
};

const setHedgehogAuthFn = (chainId) => async (obj) => {
  await requestToServer({
    url: '/createHedgehogAuthentication',
    method: 'post',
    data: {
      chain: chainId,
      ...obj,
    }
  });
};

const setHedgehogUserFn = (chainId) => async (obj) => {
  await requestToServer({
    url: '/createHedgehogUser',
    method: 'post',
    data: {
      chain: chainId,
      ...obj,
    },
  });
};

const getHedgehogAuthFn = (chainId) => async (obj) => {
  return requestToServer({
    url: '/getHedgehogAuthentication',
    method: 'get',
    params: {
      chain: chainId,
      ...obj,
    }
  });
};

const checkHedgehogWalletStatus = (vnode) => {
  if (vnode.state.hedgehog && vnode.state.hedgehog.isLoggedIn()) {
    // TODO: Handle already signed on
    vnode.state.wallet = vnode.state.hedgehog.getWallet();
  } else if (
    vnode.state.hedgehog
        && vnode.state.hedgehog.walletExistsLocally
        && vnode.state.hedgehog.walletExistsLocally()
  ) {
    vnode.state.wallet = vnode.state.hedgehog.restoreLocalWallet();
  } else {
    // TODO: Handle signed out
    vnode.state.wallet = undefined;
  }
};

const getHedgehogLoginOrSignupButton = (vnode, parentVnode, isLogin = true) => {
  return m('a.btn', {
    class: `login-with-web3${vnode.state.disabled ? ' disabled' : ''}`,
    onclick: async (e) => {
      e.preventDefault();
      const username = $(vnode.dom).find('[name="username"]').val().toString();
      const password = $(vnode.dom).find('[name="password"]').val().toString();
      if (!username) return;
      if (!password) return;
      vnode.state.disabled = true;
      vnode.state.success = false;
      vnode.state.failure = false;
      try {
        if (!password || !username) {
          vnode.state.error = messages.empty;
          return;
        }
        vnode.state.loading = true;
        vnode.state.error = '';
        try {
          const result = isLogin
            ? await vnode.state.hedgehog.login(username, password)
            : await vnode.state.hedgehog.signUp(username, password);
          checkHedgehogWalletStatus(vnode);
          // we should be logged in
          const address = vnode.state.wallet.getAddress().toString('hex');
          const signerAccount = await createUserWithAddress(address) as EthereumAccount;
          signerAccount.setWallet(vnode.state.wallet);
          const signature = await signerAccount.signMessage(signerAccount.validationToken);
          try {
            await signerAccount.validate(signature);
            vnode.state.loading = false;
            vnode.attrs.accountVerifiedCallback(signerAccount, parentVnode); // done!
            m.redraw();
          } catch (err) {
            vnode.state.error = 'Verification failed. There was an inconsistency error; '
              + 'please report this to the developers.';
            vnode.state.loading = false;
            m.redraw();
          }
        } catch (err) {
          vnode.state.error = err.message; // isLogin ? err.message : messages.exists;
          vnode.state.loading = false;
          m.redraw();
        }
      } catch (err) {
        console.log('Error', err);
        vnode.state.error = err;
        vnode.state.disabled = false;
        m.redraw();
      }
    },
  }, isLogin ? 'Login' : 'Create new wallet');
};

const HedgehogLoginForm: m.Component<{ accountVerifiedCallback, parentVnode }, { hedgehog, error }> = {
  oninit: (vnode) => {
    import('@audius/hedgehog').then((Hedgehog) => {
      vnode.state.hedgehog = new Hedgehog(
        getHedgehogAuthFn(app.chain.id),
        setHedgehogAuthFn(app.chain.id),
        setHedgehogUserFn(app.chain.id)
      );
    });
  },
  view: (vnode) => {
    const parentVnode = vnode.attrs.parentVnode;
    return m('.HedgehogLoginForm', [
      m('.hedgehog-note', [
        m('p', 'We will use these credentials to generate an Ethereum private key, '
          + 'stored locally in your browser.'),
        m('p', 'Do not lose your password! It cannot be recovered.'),
      ]),
      m('input[type="text"]', {
        name: 'username',
        placeholder: 'Username',
        oncreate: (vvnode) => {
          $(vvnode.dom).focus();
        },
      }),
      m('input[type="password"]', {
        name: 'password',
        placeholder: 'Password',
      }),
      getHedgehogLoginOrSignupButton(vnode, parentVnode, true), // login btn
      getHedgehogLoginOrSignupButton(vnode, parentVnode, false), // signup btn
      vnode.state.error && m('.error-message', vnode.state.error),
    ]);
  }
};

export default HedgehogLoginForm;
