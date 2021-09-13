import 'modals/twitter_attestation_modal.scss';

import m, { Component } from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Account, SocialAccount } from 'client/scripts/models';
import MetamaskWebWalletController from 'client/scripts/controllers/app/webWallets/metamask_web_wallet';

enum TwitterAttestationModalSteps {
  Step1Sign,
  Step2Publicize,
  Step3Verify,
  Step4Verifying,
}

const TwitterAttestationModal: m.Component<{
  account,
  twitter: SocialAccount,
  // accountVerifiedCallback: (account: Account<any>) => Promise<void>,
  refreshCallback,
},
{
  step: TwitterAttestationModalSteps, // steps for modal
  error,
  valid: boolean,
  userProvidedSignature: string;
  posted: boolean,
}> = {
  oninit:(vnode) => {
    if (!vnode.attrs.twitter.attested) {
      vnode.state.step = TwitterAttestationModalSteps.Step1Sign;
    }
  },
  view: (vnode) => {
    const { account, twitter, refreshCallback } = vnode.attrs;
    if (!twitter) return; // not what we want

    // Need to handle all drop offs at any point...

    // After Step 1

    // // check address status if currently logged in, this blob may not be necessary
    // if (app.isLoggedIn()) {
    //   const { result } = await $.post(`${app.serverUrl()}/getAddressStatus`, {
    //     address,
    //     chain: app.activeChainId(),
    //     jwt: app.user.jwt,
    //   });
    //   if (result.exists) {
    //     if (result.belongsToUser) {
    //       notifyInfo('This address is already linked to your current account.');
    //       return;
    //     } else {
    //       const modalMsg = 'This address is currently linked to another account. '
    //         + 'Remove it from that account and transfer to yours?';
    //       const confirmed = await confirmationModalWithText(modalMsg)();
    //       if (!confirmed) {
    //         vnode.state.linking = false;
    //         return;
    //       }
    //     }
    //   }
    // }

    // try {
    //   vnode.state.linking = true;
    //   m.redraw();
    //   await webWallet.validateWithAccount(signerAccount);
    //   vnode.state.linking = false;
    //   m.redraw();
    //   // return if user signs for two addresses
    //   if (linkNewAddressModalVnode.state.linkingComplete) return;
    //   linkNewAddressModalVnode.state.linkingComplete = true;
    //   accountVerifiedCallback(signerAccount);
    // } catch (err) {
    //   // catch when the user rejects the sign message prompt
    //   vnode.state.linking = false;
    //   errorCallback('Verification failed');
    //   m.redraw();
    // }

    // On Button Click after Step 2 (Post):
    const tweetPostedCallback = async (twitter, account: Account<any>) => {
      // Ping the server with twitter handle / address / (maybe some additional validation)
      // And then redraw the modal with the passed in tweet
      // Handle Errors
      // Errors being... no tweet found?
      // // Go back to previou
      // // Server side not working?
      // If Eror Allow the user to move on to the next step?
    };

    // On Button Click after Step 3 (Verify)
    // Called after we ping the server the verify that the tweet has been posted
    const twitterAttestedCallback = async (account: Account<any>) => {
      //   //
      //   //   m.redraw();
      //   //   mixpanel.track('Twitter Attested', {
      //   //     'Step No': 2,
      //   //     'Step': 'Add Address',
      //   //     'Option': 'Wallet',
      //   //     'Scope': app.activeId(),
      //   //   });
      //   //   $('.TwitterAttestationModal').trigger('modalforceexit');
      //   //   if (vnode.attrs.successCallback) vnode.attrs.successCallback();
      //   //   m.redraw();
      //   // }
      // else {
    };

    //
    const constructSignature = (username) => {
      const EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ];
      const domain = {
        name: 'Sybil Verifier',
        version: '1',
      };
      const Permit = [{ name: 'username', type: 'string' }];
      const message = { username };
      const data = JSON.stringify({
        types: {
          EIP712Domain,
          Permit,
        },
        domain,
        primaryType: 'Permit',
        message,
      });
      return Buffer.from(data).toString('hex');
    };

    const constructTweet = () => {
      // eslint-disable-next-line max-len
      const tweetText = `Verifying myself as a @hicommonwealth member 🐮🌝%0Aaddr:${account.address}%0Asig:${vnode.state.userProvidedSignature}`;
      return tweetText;
    };

    return m('.TwitterAttestationModal',
      vnode.state.step === TwitterAttestationModalSteps.Step1Sign ? [
        m('img.modal-close-button', {
          src:'/static/img/close.svg',
          onclick:() => {
            $('.TwitterAttestationModal').trigger('modalforceexit');
            m.redraw();
          },
        }),
        m('.form-steps', [
          m('', 'Sign'),
          m('.disabled-step', 'Publicize'),
          m('.disabled-step', 'Verify'),
        ]),
        m('progress.gradient-progress-bar', { value:'0.1' }),
        m('img.twitter-logo', { src:'/static/img/twitterBlueIcon.svg' }),
        m('.title', 'Sign Message'),
        m('.description', 'Sign and tweet a message that will be used to link your wallet address and Twitter handle.'),
        m('.twitter-handle', [
          m('.flex.items-baseline', [
            m('', `@${twitter.username}`),
            m('.unverfied-label', 'Unverified'),
          ]),
          m('img.close-button', { src:'/static/img/close.svg' }),
        ]),
        m('button.primary-button', {
          onclick: async (e) => {
            try {
              const wallet = await app.wallets.locateWallet(account.address, app.chain.base);
              (wallet as MetamaskWebWalletController).signMessage(`0x${constructSignature(twitter.username)}`)
                .then((signedResult) => {
                  vnode.state.step += 1;
                  vnode.state.userProvidedSignature = signedResult;
                  m.redraw();
                });
            } catch (err) {
              console.log(err);
            }
          }
        }, 'Sign'),
      ] : vnode.state.step === TwitterAttestationModalSteps.Step2Publicize ? [
        m('img.modal-close-button', {
          src:'/static/img/close.svg',
          onclick:() => {
            $('.TwitterAttestationModal').trigger('modalforceexit');
            m.redraw();
          },
        }),
        m('.form-steps', [
          m('.disabled-step', 'Sign'),
          m('', 'Publicize'),
          m('.disabled-step', 'Verify'),
        ]),
        m('progress.gradient-progress-bar', { value:'0.5' }),
        m('img.twitter-logo', { src:'/static/img/twitterBlueIcon.svg' }),
        m('.title', 'Publicize'),
        m('.tweet-preview', constructTweet()),
        m('button.primary-button', {
          onclick: async (e) => {
            window.open(`https://twitter.com/intent/tweet?text=${constructTweet()}`, '_blank');
            vnode.state.step += 1;
            m.redraw();
          }
        }, 'Tweet This'),
      ] : vnode.state.step === TwitterAttestationModalSteps.Step3Verify ? [
        m('img.modal-close-button', {
          src:'/static/img/close.svg',
          onclick:() => {
            $('.TwitterAttestationModal').trigger('modalforceexit');
            m.redraw();
          },
        }),
        m('.form-steps', [
          m('.disabled-step', 'Sign'),
          m('.disabled-step', 'Publicize'),
          m('', 'Verify'),
        ]),
        m('progress.gradient-progress-bar', { value:'1' }),
        m('img.twitter-logo', { src:'/static/img/twitterBlueIcon.svg' }),
        m('.title', 'Verify'),
        m('.description', 'Verify your tweet and add it to the list of verified mappings.'),
        m('.twitter-handle', [
          m('.flex.items-baseline', [
            m('', `@${twitter.username}`),
            m('.unverfied-label', 'Unverified'),
          ]),
          m('img.close-button', { src:'/static/img/close.svg' }),
        ]),
        m('button.primary-button', {
          onclick: async (e) => {
            vnode.state.step += 1;
            // try {
            //   const wallet = await app.wallets.locateWallet(account.address, app.chain.base);
            //   console.log(wallet);
            //   (wallet as MetamaskWebWalletController).signMessage(message);
            // } catch (err) {
            //   console.log(err);
            // }
          }
        }, 'Verify'),
      ] : vnode.state.step === TwitterAttestationModalSteps.Step4Verifying ? [
        m('img.modal-close-button', {
          src:'/static/img/close.svg',
          onclick:() => {
            $('.TwitterAttestationModal').trigger('modalforceexit');
            m.redraw();
          },
        }),
        m('img.twitter-logo', { src:'/static/img/twitterBlueIcon.svg' }),
        m('.title', 'Verify'),
        m('.description', 'We\'ll check Twitter to see that the message has been posted.'),
        m('.twitter-handle', [
          m('.flex.items-baseline', [
            m('', ''),
            m('.unverfied-label', 'Unverified'),
          ]),
          m('img.close-button', { src:'/static/img/close.svg' }),
        ]),
        m('button.primary-button', {
          onclick: async (e) => {
            vnode.state.step += 1;
            // try {
            //   const wallet = await app.wallets.locateWallet(account.address, app.chain.base);
            //   console.log(wallet);
            //   (wallet as MetamaskWebWalletController).signMessage(message);
            // } catch (err) {
            //   console.log(err);
            // }
          }
        }, 'Verify'),
      ] : [
        m('img.modal-close-button', {
          src:'/static/img/close.svg',
          onclick:() => {
            $('.TwitterAttestationModal').trigger('modalforceexit');
            m.redraw();
          },
        }),
        m('.title', 'Verification Successful'),
        m('img.twitter-logo', { src:'/static/img/logo.png' }),
        m('button.primary-button', {
          onclick: async (e) => {
            vnode.state.step += 1;
            // try {
            //   const wallet = await app.wallets.locateWallet(account.address, app.chain.base);
            //   console.log(wallet);
            //   (wallet as MetamaskWebWalletController).signMessage(message);
            // } catch (err) {
            //   console.log(err);
            // }
          }
        }, 'Close'),
      ]);
  }
};

export default TwitterAttestationModal;
