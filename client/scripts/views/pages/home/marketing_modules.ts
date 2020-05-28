import 'pages/home/marketing_modules.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Grid, Col } from 'construct-ui';

const HomepageMarketingModules = {
  view: (vnode) => {
    return m('.HomepageMarketingModules', [
      m('.homepage-section', [
        m('h2', 'Create a community'),
        m(Grid, { gutter: 20 }, [
          m(Col, { span: 4 }, [
            m('.col-block', [
              m('h3', 'Blockchains & DAOs'),
              m('p', 'A next-generation blockchain focused on usability and performance'),
              m(Button, {
                fluid: true,
                label: 'Get started',
                intent: 'primary',
                compact: true,
                size: 'sm',
                onclick: (e) => {
                }
              }),
            ]),
          ]),
          m(Col, { span: 4 }, [
            m('.col-block', [
              m('h3', 'Personal tokens'),
              m('p', 'A next-generation blockchain focused on usability and performance'),
              m(Button, {
                fluid: true,
                label: 'Get started',
                intent: 'primary',
                compact: true,
                size: 'sm',
                onclick: (e) => {
                }
              }),
            ]),
          ]),
          m(Col, { span: 4 }, [
            m('.col-block', [
              m('h3', 'Private communities'),
              m('p', 'A next-generation blockchain focused on usability and performance'),
              m(Button, {
                fluid: true,
                label: 'Get started',
                intent: 'primary',
                compact: true,
                size: 'sm',
                onclick: (e) => {
                }
              }),
            ]),
          ]),
        ]),
      ]),

      m('.homepage-section', [
        m(Grid, { gutter: 20 }, [
          m(Col, { span: 4 }, [
            m('h2', 'Why Commonwealth'),
            m('.why-commonwealth', 'A next-generation blockchain focused on usability and performance'),
          ]),
          m(Col, { span: 8 }, [
            m('.comparison-chart', [
              m('.col-block', [
                'Comparisons',
              ]),
            ]),
          ]),
        ]),
      ]),

      m('.homepage-section', [
        m('h2', 'Commonwealth for you'),
        m(Grid, { gutter: 20 }, [
          m(Col, { span: 4 }, [
            m('.col-block', [
              m('h3', 'Lorem ipsum'),
              m('p', 'A next-generation blockchain focused on usability and performance'),
            ]),
          ]),
          m(Col, { span: 4 }, [
            m('.col-block', [
              m('h3', 'Lorem ipsum'),
              m('p', 'A next-generation blockchain focused on usability and performance'),
            ]),
          ]),
          m(Col, { span: 4 }, [
            m('.col-block', [
              m('h3', 'Lorem ipsum'),
              m('p', 'A next-generation blockchain focused on usability and performance'),
            ]),
          ]),
        ]),
      ]),

      m('.homepage-section', [
        m(Grid, { gutter: 20 }, [
          m(Col, { span: 12 }, [
            m('.col-block.col-block-centered', [
              m('h4', 'Get started today'),
              m(Button, {
                label: 'Sign in',
                intent: 'primary',
                compact: true,
                onclick: (e) => {
                }
              }),
            ]),
          ]),
        ]),
      ]),
    ]);
  }
};

export default HomepageMarketingModules;
