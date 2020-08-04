import 'pages/settings/settings_well.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { selectNode, initChain } from 'app';
import { NodeInfo } from 'models';
import { Icon, Icons, Button, Input } from 'construct-ui';

const SettingsWell: m.Component<{}, { initialized: boolean }> = {
  view: (vnode) => {
    const nodes = (app.chain && app.chain.meta ? [] : [{
      name: 'node',
      label: 'Select a node',
      value: undefined,
      selected: true,
      chainId: undefined,
    }]).concat(app.config.nodes.getAll().map((n) => ({
      name: 'node',
      label: `${n.chain.id} - ${n.url}`,
      value: n.id,
      selected: app.chain && app.chain.meta && n.url === app.chain.meta.url && n.chain === app.chain.meta.chain,
      chainId: n.chain.id,
    })));

    return m('.SettingsWell', [
      m('form', [
        app.activeChainId() && [
          m('h4', 'Connect to'),
          m('.nodes', [
            m(DropdownFormField, {
              name: 'node',
              choices: nodes.filter((node) => node.chainId === app.activeChainId()),
              callback: async (result) => {
                const n: NodeInfo = app.config.nodes.getById(result);
                await selectNode(n);
                await initChain();
                m.route.set(`/${n.chain.id}/settings`);
              },
            }),
          ]),
        ],
        m('h4', 'Composer'),
        m('.composer', [
          m(RadioSelectorFormField, {
            callback: async (value) => {
              await SettingsController.disableRichText(value !== 'richtext');
              notifySuccess('Setting saved');
            },
            choices: [
              { label: 'Rich Text', value: 'richtext', checked: !app.user.disableRichText },
              { label: 'Markdown', value: 'markdown', checked: app.user.disableRichText === true }
            ],
            name: 'composer',
          })
        ]),
      ]),
    ]);
  }
};

export default SettingsWell;
