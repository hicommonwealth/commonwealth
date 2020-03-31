import 'modals/feedback_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import app from 'state';
import ResizableTextarea from 'views/components/widgets/resizable_textarea';

const FeedbackModal = {
  view: (vnode) => {
    return m('.FeedbackModal', [
      m('.header', 'Send feedback'),
      m('.compact-modal-body', [
        m(ResizableTextarea, {
          placeholder: 'Report a bug, or suggest an improvement',
          oncreate: (vnode) => {
            $(vnode.dom).focus();
          }
        }),
        m('button', {
          class: vnode.state.sending ? 'disabled' : '',
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            const $text = $(vnode.dom).find('textarea');
            const text = $text.val();
            const url = document.location.href;
            vnode.state.sending = true;
            vnode.state.error = null;
            vnode.state.success = null;

            // send feedback
            $.post(app.serverUrl() + '/sendFeedback', { text, url }).then((result) => {
              $text.val('');
              vnode.state.sending = false;
              vnode.state.success = 'Sent successfully!';
              m.redraw();
            }, (err) => {
              vnode.state.error = 'Error: ' + err.responseText;
              vnode.state.sending = false;
              m.redraw();
            });
          },
        }, vnode.state.sending ? 'Sending...' : 'Send feedback'),
        vnode.state.error && m('.error-message', vnode.state.error),
        vnode.state.success && m('.success-message', vnode.state.success),
      ]),
    ]);
  }
};

export default FeedbackModal;
