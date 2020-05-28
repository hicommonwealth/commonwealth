import 'pages/home/header.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Grid, Col, Form, FormGroup } from 'construct-ui';
import app from 'state';
import LoginModal from 'views/modals/login_modal';

const HomepageHeader = {
  view: (vnode) => {
    return m('.HomepageHeader', [
      m(Grid, [
        m(Col, { span: 5, class: 'header-col-left' }, [
          m('h1', 'Commonwealth'),
          m('h3', 'Discuss, fund, and grow decentralized communities'),
          m('p.lead-copy', [
            'Commonwealth is an open-source platform for communities ',
            'to chat together, plan initiatives, and fund community growth'
          ]),
          m(Form, { gutter: 10 }, [
            m(FormGroup, { span: 9 }, [
              m(Input, {
                placeholder: 'Email',
                fluid: true,
              }),
            ]),
            m(FormGroup, { span: 3 }, [
              m(Button, {
                label: 'Sign in',
                fluid: true,
                intent: 'primary',
              }),
            ])
          ]),
          m('.form-divider', 'or'),
          m(Form, { gutter: 10 }, [
            m(FormGroup, { span: 12 }, [
              m(Button, {
                label: 'Sign in with crypto wallet',
                fluid: true,
                intent: 'primary',
                onclick: () => app.modals.create({ modal: LoginModal }),
              }),
            ]),
          ]),
        ]),
        m(Col, { span: 7 }, [
          m('.screenshot'),
        ]),
      ]),
    ]);
  }
};

export default HomepageHeader;
