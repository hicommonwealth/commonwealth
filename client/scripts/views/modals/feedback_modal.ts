import 'modals/feedback_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Form, FormGroup, TextArea } from 'construct-ui';
import app from 'state';

const FeedbackModal: m.Component<{}, { sending, error, success }> = {
  view: (vnode) => {
    return m('.FeedbackModal', [
      m('.compact-modal-title', [
        m('h3', 'Send feedback'),
      ]),
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
              disabled: vnode.state.sending,
              intent: 'primary',
              loading: vnode.state.sending,
              label: 'Send feedback',
              onclick: (e) => {
                e.preventDefault();
                const $text = $(e.target).closest('.FeedbackModal').find('textarea');
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
