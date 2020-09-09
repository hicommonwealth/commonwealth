import 'modals/confirm_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, List, ListItem, Checkbox } from 'construct-ui';
import { Webhook } from 'models';

interface IAttrs {
    webhook: Webhook;
}

interface IState {
    selectedCategories: string[];
}

const WebhookSettingsModal: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.selectedCategories = vnode.attrs.webhook.categories;
  },
  view: (vnode) => {
      console.log('data', vnode.attrs);
    const { webhook } = vnode.attrs;
    console.log('webhook', webhook);
    // const community = webhook.
    const isChain = webhook.chain_id ? true : false;
    return m('.WebhookSettingsModal', [
        m('.title-section', [
            m('h4', 'Webhook options'),
            m('p', 'Which events should trigger a notification?'),
        ]),
        m('.forum-events', [
            m('h4', 'Off-chain events'),
            // for community, iterate through options.
            m(List, {
                interactive: false,
                size: 'sm',
            }, [
                m(ListItem, {
                    contentLeft: 'New Thread',
                    contentRight: m(Checkbox, {})
                })
            ])
        ]),
        // isChain && 
        m('.chain-events', [
            m('h4', 'On-chain events'),
            m(List, {
                interactive: false,
                size: 'sm',
            }, [
                // iterate chain events
                m(ListItem, {
                    contentLeft: 'Democracy',
                    contentRight: m(Checkbox, {})
                })
            ])
        ])
    ]);
  }
};

export default WebhookSettingsModal;
