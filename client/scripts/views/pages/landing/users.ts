import 'pages/landing/users.scss';

import { default as m } from 'mithril';
import { Card, Button, Grid, Col, Tabs, TabItem } from 'construct-ui';

interface IUserPageState {
  user: string;
}

const UsersPage : m.Component<IUserPageState> = {
  view: (vnode) => {
    var user: string = 'Community Managers';

    const users = [
      'Community Managers',
      'Validators',
      'Developers',
      'Tokenholders',
      'Project Leaders',
    ];

    return m('.CommonwealthUsers', [
      m(Tabs, {
        align: 'left',
        fluid: true,
        size: 'default',
      }, [
        users.map(user => m(TabItem, {
          label: user,
          active: vnode.attrs.user === user,
          loading: false,
          onclick: () => {
            vnode.attrs.user = user;
          },
        }))
      ]),
      vnode.attrs.user === 'Community Managers' && m('div.community', [
        m('.container', [
          m(Card, {
            elevation: 0,
            fluid: true,
            interactive: false,
            size: 'default',
            style: 'min-width: 300px'
          },
            m('h2.lead-title', 'Community Managers'),
            m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Own your community',
                ]),
                m('p.lead-description', [
                  'Commonwealth uses address-based logins to connect your users, creating a chain of interactions that can’t be destroyed. ',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Zero-cost and zero-friction',
                ]),
                m('p.lead-description', [              
                  'Launching your own Commonwealth space is easy--no dev required for hosting means you can focus on what you do best-- growing your community.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Chat won’t go away, but it can move to Commonwealth',
                ]),
                m('p.lead-description', [
                  'Keep the dialogue started in chats like Discord alive in a more organized, long-form discussion. ',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Indexable, searchable posts save you time on FAQs',
                ]),
                m('p.lead-description', [
                  'Create a channel for questions and let users easily find the information they need through a familiar format.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Herding cats has never been easier',
                ]),
                m('p.lead-description', [
                  'With subcommunities and notifications, it’s easy to organize different teams and funnel key events to who you need, when you need it.',
                ]),
              ),
            ]),
            m(Button, {
              class: '',
              // onclick: '',
              basic: false,
              outlined: true,
              label: 'Create or add your own community',
            }),
          )
        ]),
      ]),
      vnode.attrs.user === 'Validators' && m('div.validators', [
        m('.container', [
          m(Card, {
            elevation: 0,
            fluid: true,
            interactive: false,
            size: 'default',
            style: 'min-width: 300px'
          },
            m('h2.lead-title', 'Validators'),
            m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Delegators use Commonwealth',
                ]),
                m('p.lead-description', [
                  'Commonwealth attracts nominators across a growing list of supported chains.  Campaigns, profiles, and threads boost your visibility.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Validation is a cross-chain skill, use profiles to show your expertise',
                ]),
                m('p.lead-description', [              
                  'Demonstrate to delegators and community members that you validator is trustworthy through metrics, reputation and activity-feeds.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Develop a brand (and trust) with your community',
                ]),
                m('p.lead-description', [
                  'Launch your own channel to leverage notifications, announcements, marketing content and discussions.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Monitor the performance of other validators',
                ]),
                m('p.lead-description', [
                  'Detect events like slashes and reach out to affected delegators to grow your own delegator community.',
                ]),
              ),
            ]),
            m(Button, {
              class: '',
              // onclick: '',
              basic: false,
              outlined: true,
              label: 'Add your validator',
            }),
          )
        ]),
      ]),
      vnode.attrs.user === 'Developers' && m('div.developers', [
        m('.container', [
          m(Card, {
            elevation: 0,
            fluid: true,
            interactive: false,
            size: 'default',
            style: 'min-width: 300px'
          },
            m('h2.lead-title', 'Developers'),
            m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Reputation is the new thing',
                ]),
                m('p.lead-description', [
                  'Commonwealth combines code, contributions, and discussions across your chains into a unified profile to prove your skills and competencies.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Stay informed on grants and development needs',
                ]),
                m('p.lead-description', [              
                  'Tracking opportunities for funding and grants is easier with Commonwealth’s notification and discussion features. Commonwealth pings you when a new chance arrives, letting you focus on what you do best.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Coordinate with fellow developers',
                ]),
                m('p.lead-description', [
                  'Looking for project members, technical guidance, or research is easier with profiles, search, and long-form discussion',
                ]),
              ),
            ]),
            m(Button, {
              class: '',
              // onclick: '',
              basic: false,
              outlined: true,
              label: 'Complete your profile',
            }),
          )
        ]),
      ]),
      vnode.attrs.user === 'Tokenholders' && m('div.tokenholders', [
        m('.container', [
          m(Card, {
            elevation: 0,
            fluid: true,
            interactive: false,
            size: 'default',
            style: 'min-width: 300px'
          },
            m('h2.lead-title', 'Tokenholders'),
            m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Let news and events come to you',
                ]),
                m('p.lead-description', [
                  'Being a good holder means finding information across many different sources - with Commonwealth you can keep your chains in one location with access to unified profiles.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Contributions come in many forms',
                ]),
                m('p.lead-description', [              
                  'Commonwealth aggregates your votes and discussions  across chains into one unified activity feed, letting you showcase the breadth of your expertise.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Track the VIPs',
                ]),
                m('p.lead-description', [
                  'Participate in conversation, find proven validators, influential developers, and Commonwealth’s notification system lets you stay abreast of important network events.',
                ]),
              ),
            ]),
            m(Button, {
              class: '',
              // onclick: '',
              basic: false,
              outlined: true,
              label: 'Connect to your chains',
            }),
          )
        ]),
      ]),
      vnode.attrs.user === 'Project Leaders' && m('div.leaders', [
        m('.container', [
          m(Card, {
            elevation: 0,
            fluid: true,
            interactive: false,
            size: 'default',
            style: 'min-width: 300px'
          },
            m('h2.lead-title', 'Project Leaders'),
            m(Grid, { gutter: { xs: 0, sm: 10, md: 20, lg: 30, xl: 40 } }, [
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'On-chain, on-point decision making',
                ]),
                m('p.lead-description', [
                  'Move quickly from discussion to action by integrating your chain, DAO, or protocol’s on-chain governance. Commonwealth let’s your community leverage our standard UI for simple chain interaction.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Clear chains of command make your organization agile',
                ]),
                m('p.lead-description', [              
                  'Reach the team and community members you need with granular permissioning and memberships roles. Prevent abuse by ensuring community members know who has authority and trustworthiness.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Automate PR Updates',
                ]),
                m('p.lead-description', [
                  'Make it easy for journalists, writers, and researchers to find key data, discussion and updates on your projects through user notifications and search.',
                ]),
              ),
              m(Col, { span: { xs: 12, md: 4 } }, 
                m('p.lead-bold', [
                  'Inspire, inform and lead',
                ]),
                m('p.lead-description', [
                  'Longform content views and beautiful typography combine with notifications to maintain your momentum as you build your project.',
                ]),
              ),
            ]),
          )
        ]),
      ]),
      // m('div.own', [
      //   m('.container', [
      //     m('h2.lead-title', 'Join the platform for human progress.'),
      //     m(Button, {
      //       class: '',
      //       // onclick: '',
      //       basic: false,
      //       outlined: true,
      //       label: 'Create or add your own community',
      //     }),
      //   ]),
      // ]),
    ])
  }
};

export default UsersPage;
