import 'pages/landing/why.scss';

import ActionPage from './action';
import UserPage from './users';

import { default as m } from 'mithril';
import { Table, Icon, Grid, Col, Button } from 'construct-ui';

const WhyPage : m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.WhyPage', [
      m('.div.top', [
        m(Grid, { 
          gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
          align: 'middle',
          justify: 'center',
        }, [
          m(Col, { span: { xs: 12, md: 5 } }, 
            m('h2.lead-title', 'On-chain communities grow on Commonwealth.'),
            m('p.lead-description', [
              'Commonwealth is the all-in-one space for decentralized communities to chat together, plan initiatives, and fund community growth.',
            ]),
          ),
        ]),
        m(Grid, { 
          gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
          align: 'middle',
          justify: 'center',
        }, [
          m(Col, { span: { xs: 12, md: 5 } }, 
            m(Button, {
              class: '',
              // onclick: '',
              basic: false,
              outlined: true,
              label: 'Create your community',
              style: 'background-color: #ffffff',
            }),
          ),
        ])
      ]),
      m('.div.lead', [
        m('h2.lead-title', 'Why Commonwealth?'),
        m(Grid, { 
          gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
          align: 'middle',
          justify: 'center',
        }, [
          m(Col, { span: { xs: 12, md: 3 } }, 
            m('p.lead-description', [
              'The medium is the message.'
            ]),             
          ),
          m(Col, { span: { xs: 12, md: 5 } }, 
            m('p.lead-title', [
              'Threads help drive thoughtful conversation.'
            ]),
            m('p.lead-description', [
              'On Commonwealth, threads leave space for your community members to engage in thoughtful conversation. Curate threads by grouping them into featured tags, or lock threads to a select group of community members.',
            ]),
            m('p.lead-title', [
              'Integrate your existing community tools.'
            ]),
            m('p.lead-description', [
              'Commonwealth helps break down silos between chat apps like Discord, Telegram, and Riot by providing integrations for webhooks and bridges. Your community will be able to receive Commonwealth notifications wherever they are most comfortable.',
            ]),
          ),
          m(Col, { span: { xs: 12, md: 3 } }, 
            m('img.community', { src: '/static/img/marketing/articles.png' }),       
          ),
        ]),
        m(Grid, { 
          gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
          align: 'middle',
          justify: 'center',
        }, [
          m(Col, { span: { xs: 12, md: 3 } }, 
            m('p.lead-description', [
              'Your tech should match your values.'
            ]),    
          ),
          m(Col, { span: { xs: 12, md: 5 } }, 
            m('p.lead-title', [
              'Crypto-native integrations for the most popular protocols.'
            ]),
            m('p.lead-description', [
              'No matter what protocol you build on, give easy access to your project’s most important on-chain actions like staking and voting. Commonwealth has a growing list of integrations--including Ethereum, NEAR, Cosmos, Substrate, and popular DAO frameworks like Moloch or Aragon.',
            ]),
            m('p.lead-title', [
              'Commonwealth is Open.'
            ]),
            m('p.lead-description', [
              'Fork, develop, alter, share - Commonwealth is explicitly designed for open-source ecosystems. Existing solutions like chat and email lock your data, users, and brand into platforms you don’t control. Default openness allows new members to discover you through SEO.',
            ]),
          ),
          m(Col, { span: { xs: 12, md: 3 } }, 
            m('img.community', { src: '/static/img/marketing/threads.png' }),       
          ),
        ]),
      ]),
      m('.div.users', [
        m(UserPage),
      ]),
      m('.div.features', [
        m('h2.lead-title', 'Commonwealth in Action'),
        m(ActionPage),
      ]),
      // m('.div.features', [
      //   m('.container', [
      //     m('h2.lead-title', 'Features'),
      //     m('p.lead-description', [
      //       'Zero hosting costs. No fees. No servers. No ads. ',
      //     ]),
      //     m('p.lead-description', [
      //       'Discussion. Markdown and rich text power long-form threads with tags and flair. '
      //     ]),
      //     m('p.lead-description', [
      //       'Open API. Open-source and open-data, integrate Commonwealth events into your apps or send data to Commonwealth.' 
      //     ]),
      //     m('p.lead-description', [
      //       'Chain Integration. Go serverless with  networks like Ethereum, Edgeware and NEAR to maximize transparency and accountability.' 
      //     ]),
      //     m('p.lead-description', [
      //       'Notifications. Leverage a single feed of notifications to reach users on threads, decisions, and more. ',
      //     ]),
      //     m('p.lead-description', [
      //       'Chat. Shortform is where all good ideas start - keep a chatbox across your pages to keep conversational momentum.'
      //     ]),
      //     m('p.lead-description', [
      //       'Admin and Moderate. Pin, delete, ban, add, edit, notify, using the powers you know and love from classic platforms. '
      //     ]),
      //     m('p.lead-description', [
      //       'Profiles. Profiles help you understand your fellow community members, track their activity, and interact more intimately. '
      //     ]),
      //     m('p.lead-description', [
      //       'Coming soon: Decentralization. Run Commonwealth on your own terms. '
      //     ]),
      //   ]),
      // ]),
      m('.div.comparison', [
        m('.container', [
          m('h2.lead-title', 'Commonwealth Compared'),
          m(FeatureTable),
        ]),
      ]),
      m('.div.own', [
        m('.container', [
          m(Grid, { 
            gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
            align: 'middle',
            justify: 'center',
          }, [
            m(Col, { span: { xs: 12, md: 7 } }, 
              m('h2.lead-title', 'Join the platform for human progress.'),
            ),
            m(Col, { span: { xs: 12, md: 3 } }, 
              m(Button, {
                class: '',
                // onclick: '',
                basic: false,
                outlined: true,
                label: 'Create your own community',
                style: 'background-color: #ffffff'
              }),
            ),
          ])
        ]),
      ]),
    ])
  }
};

const FeatureTable = {
  view: (vnode) => {
    return m(Table, {
      bordered: true,
      interactive: false,
      striped: false,
    }, [
      m('tr', [
        m('th', 'Feature'),
        m('th', 'Commonwealth'),
        m('th', 'Telegram'),
        m('th', 'Discord'),
        m('th', 'Discourse'),
      ]),
      m('tr', [
        m('td', 'Crypto Integrated'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'Open Source'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'Multi-Channel'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'Direct Messaging'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'Address-Based Login'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'Multi-Platform'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'In-App Notifications'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'Zero Hosting Cost'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'User Profiles and Feeds'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'Admin and Moderation'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'Open API'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'Long-form Threading'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'Markdown Support'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
      m('tr', [
        m('td', 'SEO Optimized'),
        m('td', m(Icon,  { name: 'check-circle'})),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon,  { name: 'check-circle'})),
      ]),
    ])
  }
};

export default WhyPage;
