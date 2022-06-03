/* @jsx m */

import 'modals/twitter_attestation_modal.scss';

import m, { Component } from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Account, SocialAccount, AddressInfo } from '../../models';
import MetamaskWebWalletController from '../../controllers/app/webWallets/metamask_web_wallet';
import { notifyError } from '../../controllers/app/notifications';
import { loadScript } from '../../helpers';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWButton } from '../components/component_kit/cw_button'

enum TwitterAttestationModalSteps {
  Step0ChooseAddress,
  Step1LinkTwitter,
  Step2Sign,
  Step3Publicize,
  Step4Verify,
}

type TwitterAttestationModalAttrs = {
  addresses: Array<AddressInfo>,
  twitterAccount: SocialAccount,
  refreshCallback,
}

type TwitterAttestationModalState = {
  step: TwitterAttestationModalSteps, // steps for modal
  addressSelected: AddressInfo,
  error,
  tweet: string, // id for tweet
  tweetLoaded: boolean,
  userProvidedSignature: string;
  valid: boolean, // Step 2 Signed
  posted: boolean, // Step 3 Posted to Twitter
  attested: boolean, // Step 4 Verified
}

class TwitterAttestationModal implements m.Component<TwitterAttestationModalAttrs, TwitterAttestationModalState> {

    oninit(vnode) {
      vnode.state.step = TwitterAttestationModalSteps.Step0ChooseAddress
      console.log(vnode.attrs.addresses)
      console.log(vnode.attrs.twitterAccount)
    }

    view(vnode) {
      const currentStep = vnode.state.step;
      return (
        <div className="TwitterAttestationModal">
          <div>
            <img className="modal-close-button" src="/static/img/close.svg" onclick={() => {
              $('.TwitterAttestationModal').trigger('modalforceexit');
              m.redraw();
            }}/>
          </div>

          <div className="form-steps">
            <p onclick={()=>{
              if (TwitterAttestationModalSteps.Step0ChooseAddress < currentStep) {
                vnode.state.step = TwitterAttestationModalSteps.Step0ChooseAddress
              }}}> 
              Address 
            </p>

            <p onclick={()=>{
              if (TwitterAttestationModalSteps.Step1LinkTwitter < currentStep) {
                vnode.state.step = TwitterAttestationModalSteps.Step1LinkTwitter
              }}}
              className={currentStep < TwitterAttestationModalSteps.Step1LinkTwitter ? 
                "disabled-step" : ""}>
              Link
            </p>

            <p onclick={()=>{
              if (TwitterAttestationModalSteps.Step2Sign < currentStep) {
                vnode.state.step = TwitterAttestationModalSteps.Step2Sign
              }}}
              className={currentStep < TwitterAttestationModalSteps.Step2Sign ? 
                "disabled-step" : ""}>
              Sign
            </p>

            <p onclick={()=>{
              if (TwitterAttestationModalSteps.Step3Publicize < currentStep) {
                vnode.state.step = TwitterAttestationModalSteps.Step3Publicize
              }}}
              className={currentStep < TwitterAttestationModalSteps.Step3Publicize ? 
                "disabled-step" : ""}>
              Publicize
            </p>

            <p onclick={()=>{
              if (TwitterAttestationModalSteps.Step4Verify < currentStep) {
                vnode.state.step = TwitterAttestationModalSteps.Step4Verify
              }}}
              className={currentStep < TwitterAttestationModalSteps.Step4Verify ? 
                "disabled-step" : ""}>
              Verify
            </p>
          </div>

          { 
            m('progress.gradient-progress-bar', { value: currentStep / 5 })
          }

          <div className="twitter-icon">
            <CWIcon iconName="twitter" iconSize="large" />
          </div>

          {
            // Step 0
            vnode.state.step === TwitterAttestationModalSteps.Step0ChooseAddress ?
              <div>
                <div className="title"> Choose an address </div>
                <div className="description"> Choose an address to link to your Twitter account. </div>
                <div className="action">
                  {
                    vnode.attrs.addresses.map(address => 
                      <CWButton
                        className="address"
                        label={this.truncateAddress(address.address)}
                        buttonType="secondary"
                        onclick={()=>{
                          vnode.state.addressSelected = address
                          vnode.state.step += TwitterAttestationModalSteps.Step1LinkTwitter
                        }}
                      />
                    )
                  }
                </div>
              </div> :

            // Step 1
            vnode.state.step === TwitterAttestationModalSteps.Step1LinkTwitter ?
              <div>
                <div className="title"> Link your twitter account </div>
                <div className="description"> Authorize Commonwealth to post a tweet on your behalf for the following address: </div>
                <div className="selected-address">
                  { vnode.state.addressSelected.address }
                </div>
                <div className="action">
                  {
                    m('button.primary-button', {
                      onclick: async (e) => {
                        window.location.href = `/api/auth/twitter?redirect=${encodeURIComponent(window.location.pathname)}${window.location.search ? `${encodeURIComponent(window.location.search)}%26` : '%3F'}continueTwitterAttestation=true`
                      }
                    }, 'Link')
                  }
                </div>
              </div> :

            // Step 2
            vnode.state.step === TwitterAttestationModalSteps.Step2Sign ?
              <div>
                <div className="title"> Sign message </div>
                <div className="description"> Sign and tweet a message that will be used to link your wallet address and Twitter handle for interactions on Commonwealth </div>
                <div className="action">

                </div>                  
              </div> :

            // Step 3 
            vnode.state.step === TwitterAttestationModalSteps.Step3Publicize ?
              <div>
                <div className="title"> Publicize </div>
                <div className="description"> </div>
                <div className="action">

                </div>  
              </div> :
              
            // Step 4
            vnode.state.step === TwitterAttestationModalSteps.Step4Verify ?
              <div>
                <div className="title"> Verify </div>
                <div className="description"> Verify your tweet and add it to the list of verified mappings. </div>
                <div className="action">
                  
                </div>
              </div> : <div />
          }
        </div>
      )

    }

    truncateAddress = (address: string) => {
      return address.length > 30 ? `${address.slice(0,30)}...` : address
    }

    constructSignature = (username) => {
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
    }

    constructTweet = () => {
      // eslint-disable-next-line max-len
      const tweetText = `Verifying myself as a @hicommonwealth member 🐮🌝%0Aaddr:${account.address}%0Asig:${vnode.state.userProvidedSignature}`;
      return tweetText;
    };

    tweetPreview = () => {
      // eslint-disable-next-line max-len
      const tweetText = `Verifying myself as a <a href="https://twitter.com/hicommonwealth" target="_blank">@hicommonwealth</a> member 🐮🌝%0Aaddr:${account.address}%0Asig:${vnode.state.userProvidedSignature}`;
      return tweetText;
    };
}

export default TwitterAttestationModal;