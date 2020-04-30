import 'modals/feedback_modal.scss';

import { default as m } from 'mithril';
import { default as $ } from 'jquery';
import { Button, Form, FormGroup, TextArea } from 'construct-ui';
import app from 'state';

const FeedbackModal = {
  view: (vnode) => {
    return m('.FeedbackModal', [
      m('.header', 'Send feedback'),
      m('.compact-modal-body', [
        m(Form, { fluid: true }, [
          m(FormGroup, [
            m(TextArea, {
              placeholder: 'Report a bug, or suggest an improvement',
              oncreate: (vvnode) => {
                $(vvnode.dom).focus();
              }
            }),
          ]),
          m(FormGroup, [
            m(Button, {
              class: vnode.state.sending ? 'disabled' : '',
              intent: 'primary',
              loading: vnode.state.sending,
              label: 'Send feedback',
              onclick: (e) => {
                e.preventDefault();
                const $text = $(vnode.dom).find('textarea');
                const text = $text.val();
                const url = document.location.href;
                vnode.state.sending = true;
                vnode.state.error = null;
                vnode.state.success = null;

                // send feedback
                $.post(`${app.serverUrl()}/sendFeedback`, { text, url }).then((result) => {
                  $text.val('');
                  vnode.state.sending = false;
                  vnode.state.success = 'Sent successfully!';
                  m.redraw();
                }, (err) => {
                  vnode.state.error = err.responseJSON?.error || err.responseText;
                  vnode.state.sending = false;
                  m.redraw();
                });
              },
            }),
            vnode.state.error && m('.error-message', vnode.state.error),
            vnode.state.success && m('.success-message', vnode.state.success),
          ]),
        ]),
      ]),
    ]);
  }
};

export default FeedbackModal;
