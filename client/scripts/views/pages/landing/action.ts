import 'pages/landing/action.scss';

import m from 'mithril';
import { Card, Icon, Button, Grid, Col, Tabs, TabItem } from 'construct-ui';

interface IActionPageState {
  active: string;
}

const ActionPage : m.Component<IActionPageState> = {
  view: (vnode) => {
    if (!vnode.attrs.active) vnode.attrs.active = 'Near';

    const communities = [
      'Near',
      'Edgeware',
      'Kusama',
      'Moloch',
      'Roll'
    ];

    return m('.ActionPage', [
      m('.div.near', [
        m('.action.container', [
          m(Grid, {
            gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
            align: 'middle',
            justify: 'center',
          }, [
            m(Col, { span: { xs: 12, md: 4 } },
              m('img.community', { src: '/static/img/marketing/near_cw.png' }),),
            m(Col, { span: { xs: 12, md: 6 } },
              m('p.lead-title', 'Discussion is where action starts'),
              m('p.lead-description', [
                'The decision makers of NEAR platform created a single place their users could expand on thoughts from their chat channels, organize dialog using hashtags, and connect their on-chain IDs to their discussion leaders.',
              ]),),
          ]),
        ]),
      ]),
      // vnode.attrs.active === 'Edgeware' &&
      m('.div.edgeware', [
        m('.action.container', [
          m(Grid, {
            gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
            align: 'middle',
            justify: 'center',
          }, [
            m(Col, { span: { xs: 12, md: 4 } },
              m('img.community', { src: '/static/img/marketing/edg_cw.png' }),),
            m(Col, { span: { xs: 12, md: 6 } },
              m('p.lead-title', 'Elections, treasuries--all on Commonwealth'),
              m('p.lead-description', [
                'Edgeware users need an easy way to test governance functions, plan funding and priorities for the development of the chain, and track candidates for elections. Commonwealth’s custom integrations mapped all of Edgeware’s needs and gives users clear view into the stake of users - promoting sybil resistance.',
              ]),),
          ]),
        ]),
      ]),
      // vnode.attrs.active === 'Kusama' &&
      m('.div.kusama', [
        m('.action.container', [
          m(Grid, {
            gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
            align: 'middle',
            justify: 'center',
          }, [
            m(Col, { span: { xs: 12, md: 4 } },
              m('img.community', { src: '/static/img/marketing/ksm_cw.png' }),),
            m(Col, { span: { xs: 12, md: 6 } },
              m('.action.item-large', [
                m('p.lead-title', 'Proposals need explanation'),
                m('p.lead-description', [
                  'Commonwealth provides the Kusama community with a venue to add proposal metadata for added context around a decision. Now anyone in the community can use Commonwealth to create a proposal, vote, or browse and existing archive of past network decisions.',
                ]),
              ]),),
          ]),
        ]),
      ]),
      // vnode.attrs.active === 'Moloch' &&
      m('.div.moloch', [
        m('.action.container', [
          m(Grid, {
            gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
            align: 'middle',
            justify: 'center',
          }, [
            m(Col, { span: { xs: 12, md: 4 } },
              m('img.community', { src: '/static/img/marketing/moloch_cw.png' }),),
            m(Col, { span: { xs: 12, md: 6 } },
              m('p.lead-title', 'Integration your own DAO'),
              m('p.lead-description', [
                'MolochDAO support lets any DAO creator leverage the proven MolochDAO mechanisms while  Commonwealth handles the interface and forum-deployment, including permissioned access to only the DAO’s token-holders.  With over 40 Moloch-Style DAOs, it’s easy to participate in many from one Commonwealth interface.',
              ]),),
          ]),
        ]),
      ]),
      // vnode.attrs.active === 'Roll' &&
      m('.div.roll', [
        m('.action.container', [
          m(Grid, {
            gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
            align: 'middle',
            justify: 'center',
          }, [
            m(Col, { span: { xs: 12, md: 4 } },
              m('img.community', { src: '/static/img/marketing/roll_cw.png' }),),
            m(Col, { span: { xs: 12, md: 6 } },
              m('.action.item-large', [
                m('p.lead-title', 'Connect your personal token to a community'),
                m('p.lead-description', [
                  'Commonwealth is the all-in-one space for decentralized communities to chat together, plan initiatives, and fund community growth.',
                ]),
              ]),),
          ]),
        ]),
      ]),
      // m('.div.own', [
      //   m('.action.container', [
      //     m('h2.lead-title', 'Create your own crypto integration'),
      //     m('p.lead-description', [
      //       'Commonwealth is the all-in-one space for decentralized communities to chat together, plan initiatives, and fund community growth.',
      //     ]),
      //   ]),
      // ]),
    ]);
  }
};

export default ActionPage;
