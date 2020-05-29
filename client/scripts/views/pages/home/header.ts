import 'pages/home/header.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Grid, Col, Form, FormGroup } from 'construct-ui';
import app from 'state';

import Login from 'views/components/login';
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
          m(Login, { hideHeader: true }),
        ]),
        m(Col, { span: 7 }, [
          m('.screenshot'),
        ]),
      ]),
    ]);
  }
};

export default HomepageHeader;
