import 'modals/login_modal.scss';

import m from 'mithril';
import Login from 'views/components/login';

const LoginModal: m.Component<{ defaultEmail?: string }> = {
  view: (vnode) => {
    const { defaultEmail } = vnode.attrs;
    return m('.LoginModal', [
      m('.compact-modal-title', [
        m('h3', 'Log in or create account'),
      ]),
      m('.compact-modal-body', [
        m(Login, { defaultEmail }),
      ]),
      m('.compact-modal-actions', [
      ]),
    ]);
  }
};

export default LoginModal;
