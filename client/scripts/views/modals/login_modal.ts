import 'modals/login_modal.scss';

import m from 'mithril';
import Login from 'views/components/login';

const LoginModal = {
  view: (vnode) => {
    return m('.LoginModal', [
      m('.compact-modal-body', [
        m(Login),
      ]),
      m('.compact-modal-actions', [
      ]),
    ]);
  }
};

export default LoginModal;
