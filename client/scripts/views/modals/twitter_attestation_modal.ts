import 'modals/twitter_attestation_modal.scss';

import m, { Component } from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Account, SocialAccount } from 'client/scripts/models';
import MetamaskWebWalletController from 'client/scripts/controllers/app/webWallets/metamask_web_wallet';
import { notifyError } from '../../controllers/app/notifications';
import { loadScript } from 'helpers';

enum TwitterAttestationModalSteps {
  Step0LinkTwitter,
  Step1Sign,
  Step2Publicize,
  Step3Verify,
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
  twitterAcct, // full Social Acct Obj
  tweet, // id for tweet
  tweetLoaded,
  userProvidedSignature: string;
  valid: boolean, // Step 2 Signed
  posted: boolean, // Step 3 Posted to Twitter
  attested: boolean, // Step 4 Verified
}> = {
  oninit:(vnode) => {
    vnode.state.twitterAcct = vnode.attrs.twitter;
    if (!vnode.state.twitterAcct?.attested) {
      vnode.state.step = TwitterAttestationModalSteps.Step1Sign;
    } else if (!vnode.state.twitterAcct.attested) {
      vnode.state.step = TwitterAttestationModalSteps.Step2Publicize;
    }
    vnode.state.tweetLoaded = false;
  },
  onupdate: (vnode) => {
    // Add Twitter Embed Widget to embed tweet
    if (vnode.state.step === TwitterAttestationModalSteps.Step3Verify) {
      loadScript('https://platform.twitter.com/widgets.js').then(() => {
        setTimeout(async () => {
            // eslint-disable-next-line
            (<any>window).twttr?.widgets?.load();
            if (!vnode.state.tweetLoaded) {
              // @ts-ignore
              window.twttr.widgets.createTweet(
                vnode.state.tweet,
                document.getElementById('tweet-container')
              )
              .then(() => {
                vnode.state.tweetLoaded = true;
                m.redraw();
              });
            }
        }, 1);
      });
    };
  },
  view: (vnode) => {
    const { account, twitter, refreshCallback } = vnode.attrs;
    const { twitterAcct, tweet } = vnode.state;
    if (!twitter) return; // not what we want

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

    const tweetPreview = () => {
      // eslint-disable-next-line max-len
      const tweetText = `Verifying myself as a <a href="https://twitter.com/hicommonwealth" target="_blank">@hicommonwealth</a> member 🐮🌝%0Aaddr:${account.address}%0Asig:${vnode.state.userProvidedSignature}`;
      return tweetText;
    };

    return m('.TwitterAttestationModal', vnode.state.step === 
      TwitterAttestationModalSteps.Step0LinkTwitter ? [
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
          m('.disabled-step', 'Verify'),
        ]),
        m('progress.gradient-progress-bar', { value:'0.0' }),
        m('img.twitter-logo', { src:'/static/img/twitterBlueIcon.svg' }),
        m('.title', 'Link a new Twitter'),
        m('.description', 'Authorize Commonwealth to post a tweet on your behalf.'),
        m('button.primary-button', {
          onclick: async (e) => {
            window.location.href = `/api/auth/twitter?redirect=${encodeURIComponent(window.location.pathname)}${window.location.search ? `${encodeURIComponent(window.location.search)}%26` : '%3F'}continueTwitterAttestation=true`
          }
        }, 'Link')
      ] : vnode.state.step === TwitterAttestationModalSteps.Step1Sign ? [
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
        m('.description', 'Sign and tweet a message that will be used to link your wallet address and Twitter handle for interactions on Commonwealth'),
        m('.twitter-handle', [
          m('.flex.items-baseline', [
            m('.mr-10', `@${twitterAcct.username}`),
            m('.unverfied-label', 'Unverified'),
          ]),
          m('img.close-button', { 
            src:'/static/img/close.svg', 
            onclick: async (e) => {
              $.ajax({
                url: `${app.serverUrl()}/socialAccount`,
                data: { jwt: app.user.jwt, provider : 'twitter' },
                type: 'DELETE',
                success: (result) => {
                  vnode.state.step -= 1;
                  vnode.state.twitterAcct = null;
                  m.redraw();
                },
                error: (err) => {
                  console.dir(err);
                  m.redraw();
                },
              });
            }
          }),
        ]),
        m('button.primary-button', {
          onclick: async (e) => {
            try {
              const wallet = await app.wallets.locateWallet(account.address, app.chain.base);
              /* ensure that this will work for non ETH cxhains*/
              wallet.signMessage(`0x${constructSignature(twitterAcct.username)}`)
                .then((signedResult) => {
                  vnode.state.step += 1;
                  vnode.state.userProvidedSignature = signedResult;
                  /* save unfinished signature to server */
                  // $.post(`${app.serverUrl()}/updateAddress`, params)
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
          m('', 'Sign'),
          m('', 'Publicize'),
          m('.disabled-step', 'Verify'),
        ]),
        m('progress.gradient-progress-bar', { value:'0.5' }),
        m('img.twitter-logo', { src:'/static/img/twitterBlueIcon.svg' }),
        m('.title', 'Publicize'),
        m('.tweet-preview', m.trust(tweetPreview())),
        m('button.primary-button', {
          onclick: async (e) => {
            const params = {
              tweet: constructTweet(),
              handle: twitterAcct.username,
              address: account.address,
            }
            $.post(`${app.serverUrl()}/post-tweet`, params)
              .then(async (res) => {
                vnode.state.tweet = res.result.id
                vnode.state.posted = true;
                vnode.state.step += 1;
                m.redraw();
              })
              .catch((e) => {
                console.log(e);
                vnode.state.step = 2;
                m.redraw();
              });
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
          m('', 'Sign'),
          m('', 'Publicize'),
          m('', 'Verify'),
        ]),
        m('progress.gradient-progress-bar', { value:'1' }),
        m('img.twitter-logo', { src:'/static/img/twitterBlueIcon.svg' }),
        m('.title', 'Verify'),
        m('.description', 'Verify your tweet and add it to the list of verified mappings.'),
        m('.embedded-twitter', [
          m('', {
            id: 'tweet-container',
          })
        ]),
        tweet && !vnode.state.tweetLoaded && m('.unverfied-label', 'We found your tweet and are loading it in'),
        m('button.primary-button', {
          onclick: async (e) => {
            if (tweet) {
              vnode.state.step += 1;
              const params = {
                tweetID: tweet,
                twitter_username: twitter.username,
                address: account.address,
                chain: app.activeChainId(),
                auth: true,
                jwt: app.user.jwt,
              }
              $.post(`${app.serverUrl()}/createTwitterVerification`, params)
                .then(async (res) => {
                  vnode.state.attested = true;
                  vnode.state.step += 1;
                  if(res && res.status == 'Success')
                    location.reload();
                  else
                    m.redraw();
                })
                .catch((e) => {
                  console.log(e);
                  vnode.state.step = 2;
                  m.redraw();
                });
            } else {
              $.get(`${app.serverUrl()}/latest-tweet?handle=${twitter.username}`)
                .then(async (res) => {
                  if (res.result.data[0]) {
                    if (res.result.data[0].text.includes(`sig:${vnode.state.userProvidedSignature}`)) {
                      vnode.state.tweet = res.result.data[0].id;
                      if (!vnode.state.tweetLoaded) {
                        // @ts-ignore
                        window.twttr.widgets.createTweet(
                          vnode.state.tweet,
                          document.getElementById('tweet-container')
                        )
                        .then(() => {
                          vnode.state.tweetLoaded = true;
                          m.redraw();
                        });
                      }
                    } else {
                      notifyError('Tweet not found, try again with exact message.');
                    }
                  } else {
                    notifyError('Tweet not found');
                  }
                  m.redraw();
                })
                .catch(() => {
                  notifyError('Tweet not found');
                  m.redraw();
                });
            }
          }
        }, tweet ? 'Verify' : 'Search Twitter'),
      ] : [
        m('img.modal-close-button', {
          src:'/static/img/close.svg',
          onclick:() => {
            $('.TwitterAttestationModal').trigger('modalforceexit');
            m.redraw();
          },
        }),
        m('img.twitter-logo', { src:'/static/img/checkmark.svg' }),
        m('.title', 'Verification Successful'),
        m('button.primary-button', {
          onclick: async () => {
            $('.TwitterAttestationModal').trigger('modalforceexit');
            refreshCallback();
            const href = window.location.href;
            m.route.set(href.substring(0, href.indexOf('continueTwitterAttestation=true') - 1));
          }
        }, 'Close'),
      ]);
  }
};

export default TwitterAttestationModal;
