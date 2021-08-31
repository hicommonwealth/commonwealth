import 'modals/twitter_attestation_modal.scss';

import m from 'mithril';

const TwitterAttestationModal = {
  view: (vnode) => {
    return m('.TwitterAttestationModal', [
      m('img.close-button', { src:'/static/img/close.svg' }),
      m('.form-steps', [
        m('', 'Sign'),
        m('.disabled-step', 'Publicize'),
        m('.disabled-step', 'Verify'),
      ]),
      m('progress.gradient-progress-bar', { value:'0.1' }),
      m('.title', 'Sign Message'),
      m('.description', 'Sign and tweet a message that will be used to link your wallet address and Twitter handle.'),
      m('.twitter-handle', [
        m('.flex', [
          m('', '@7racker'),
          m('', 'Unverified'),
        ]),
        m('', 'X'),
      ]),
      m('button.primary-button', 'Sign'),
    ]);
  }
};

export default TwitterAttestationModal;
