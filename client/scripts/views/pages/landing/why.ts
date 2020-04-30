import 'pages/landing/why.scss';


import { default as m } from 'mithril';
import { Table, Icon, Grid, Col, Button, Tabs, TabItem } from 'construct-ui';
import ActionPage from './action';

interface IUserPageState {
  user: string;
}

const WhyPage : m.Component<IUserPageState, {}> = {
  view: (vnode) => {
    const users = [
      'Community Managers',
      'Validators',
      'Developers',
      'Tokenholders',
      'Project Leaders',
    ];

    if (!vnode.attrs.user) vnode.attrs.user = users[0];

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
            ]),),
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
            }),),
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
            m('p.lead-title', [
              'The medium is the message.'
            ]),),
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
            ]),),
          m(Col, { span: { xs: 12, md: 3 } },
            m('img.explainer', { src: '/static/img/marketing/articles.png' }),),
        ]),
        m(Grid, {
          gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 },
          align: 'middle',
          justify: 'center',
        }, [
          m(Col, { span: { xs: 12, md: 3 } },
            m('p.lead-title', [
              'Your tech should match your values.'
            ]),),
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
            ]),),
          m(Col, { span: { xs: 12, md: 3 } },
            m('img.explainer', { src: '/static/img/marketing/threads.png' }),),
        ]),
      ]),
      m('.div.users', [
        m('h2.lead-title', 'Commonwealth for You'),
        m('.CommonwealthUsers', [
          m('Tab', [
            m(Tabs, {
              align: 'center',
              fluid: true,
              size: 'default',
            }, [
              users.map((user) => m(TabItem, {
                label: user,
                active: vnode.attrs.user === user,
                loading: false,
                onclick: () => {
                  vnode.attrs.user = user;
                },
              }))
            ]),
          ]),
          vnode.attrs.user === 'Community Managers' && m('div.community', [
            m('.container', [
              m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Zero-cost and zero-friction',
                  ]),
                  m('p.lead-description', [
                    'Launching your own Commonwealth space is easy--no dev required for hosting means you can focus on what you do best-- growing your community.',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Indexable, searchable posts save you time on FAQs',
                  ]),
                  m('p.lead-description', [
                    'Create a channel for questions and let users easily find the information they need through a familiar format.',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Herding cats has never been easier',
                  ]),
                  m('p.lead-description', [
                    'With subcommunities and notifications, it’s easy to organize different teams and funnel key events to who you need, when you need it.',
                  ]),),
              ]),
              m(Button, {
                class: '',
                // onclick: '',
                basic: false,
                outlined: true,
                label: 'Create or add your own community',
                style: 'background-color: #ffffff',
              }),
            ]),
          ]),
          vnode.attrs.user === 'Validators' && m('div.validators', [
            m('.container', [
              m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Delegators use Commonwealth',
                  ]),
                  m('p.lead-description', [
                    'Commonwealth attracts nominators across a growing list of supported chains.  Campaigns, profiles, and threads boost your visibility',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Validation is a cross-chain skill, use profiles to show your expertise',
                  ]),
                  m('p.lead-description', [
                    'Demonstrate to delegators and community members that you validator is trustworthy through metrics, reputation and activity-feeds',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Develop a brand (and trust) with your community',
                  ]),
                  m('p.lead-description', [
                    'Launch your own channel to leverage notifications, announcements, marketing content and discussions',
                  ]),),
              ]),
              m(Button, {
                class: '',
                // onclick: '',
                basic: false,
                outlined: true,
                label: 'Add your validator',
                style: 'background-color: #ffffff',
              }),
            ]),
          ]),
          vnode.attrs.user === 'Developers' && m('div.developers', [
            m('.container', [
              m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Reputation is the new thing',
                  ]),
                  m('p.lead-description', [
                    'Commonwealth combines code, contributions, and discussions across your chains into a unified profile to prove your skills and competencies',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Stay informed on grants and development needs',
                  ]),
                  m('p.lead-description', [
                    'Keep track of and get funding opportunities across all your favorite blockchain projects using notification and discussion features'
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Coordinate with fellow developers',
                  ]),
                  m('p.lead-description', [
                    'Looking for project members, technical guidance, or research is easier with profiles, search, and long-form discussion',
                  ]),),
              ]),
              m(Button, {
                class: '',
                // onclick: '',
                basic: false,
                outlined: true,
                label: 'Complete your profile',
                style: 'background-color: #ffffff',
              }),
            ]),
          ]),
          vnode.attrs.user === 'Tokenholders' && m('div.tokenholders', [
            m('.container', [
              m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Let news and events come to you',
                  ]),
                  m('p.lead-description', [
                    'Being a good holder means finding information across many different sources - with Commonwealth you can keep your chains in one location with access to unified profiles',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Contributions come in many forms',
                  ]),
                  m('p.lead-description', [
                    'Commonwealth aggregates your votes and discussions  across chains into one unified activity feed, letting you showcase the breadth of your expertise',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Track the VIPs',
                  ]),
                  m('p.lead-description', [
                    'Participate in conversation, find proven validators, influential developers, and Commonwealth’s notification system lets you stay abreast of important network events',
                  ]),),
              ]),
              m(Button, {
                class: '',
                // onclick: '',
                basic: false,
                outlined: true,
                label: 'Connect to your chains',
                style: 'background-color: #ffffff',
              }),
            ]),
          ]),
          vnode.attrs.user === 'Project Leaders' && m('div.leaders', [
            m('.container', [
              m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'On-chain, on-point decision making',
                  ]),
                  m('p.lead-description', [
                    'Move quickly from discussion to action by integrating your chain, DAO, or protocol’s on-chain governance. Commonwealth let’s your community leverage our standard UI for simple chain interaction',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Clear chains of command make your organization agile',
                  ]),
                  m('p.lead-description', [
                    'Reach the team and community members you need with granular permissioning and memberships roles. Prevent abuse by ensuring community members know who has authority and trustworthiness',
                  ]),),
                m(Col, { span: { xs: 12, md: 4 } },
                  m('p.lead-bold', [
                    'Inspire, inform and lead',
                  ]),
                  m('p.lead-description', [
                    'Longform content views and beautiful typography combine with notifications to maintain your momentum as you build your project',
                  ]),),
              ]),
            ]),
          ]),
        ]),
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
              m('h2.lead-title', 'Join the platform for human progress.'),),
            m(Col, { span: { xs: 12, md: 3 } },
              m(Button, {
                class: '',
                // onclick: '',
                basic: false,
                outlined: true,
                label: 'Create your own community',
                style: 'background-color: #ffffff'
              }),),
          ])
        ]),
      ]),
    ]);
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
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'Open Source'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'Multi-Channel'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'Direct Messaging'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'Address-Based Login'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'Multi-Platform'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'In-App Notifications'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'Zero Hosting Cost'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
      ]),
      m('tr', [
        m('td', 'User Profiles and Feeds'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'Admin and Moderation'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'Open API'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'Long-form Threading'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'Markdown Support'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
      m('tr', [
        m('td', 'SEO Optimized'),
        m('td', m(Icon, { name: 'check-circle' })),
        m('td', ' '),
        m('td', ' '),
        m('td', m(Icon, { name: 'check-circle' })),
      ]),
    ]);
  }
};

export default WhyPage;
