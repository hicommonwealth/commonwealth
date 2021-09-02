import 'modals/twitter_attestation_modal.scss';

import m from 'mithril';
import $ from 'jquery';

const TwitterAttestationModal = {
  view: (vnode) => {
    return m('.TwitterAttestationModal', [
      m('img.modal-close-button', {
        src:'/static/img/close.svg',
        onclick:() => {
          $(vnode.dom).trigger('modalforceexit');
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
          m('', '@7racker'),
          m('.unverfied-label', 'Unverified'),
        ]),
        m('img.close-button', { src:'/static/img/close.svg' }),
      ]),
      m('button.primary-button', 'Sign'),
    ]);
  }
};

export default TwitterAttestationModal;
