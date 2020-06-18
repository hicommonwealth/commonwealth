import 'pages/settings/settings_well.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { selectNode } from 'app';
import { NodeInfo } from 'models';
import { Icon, Icons, Button, Input } from 'construct-ui';

interface IState {
  initialized: boolean;
  showMoreSettings: boolean;
}

const SettingsWell: m.Component<{}, IState> = {
  view: (vnode) => {
    const nodes = (app.chain && app.chain.meta ? [] : [{
      name: 'node',
      label: 'Select a node',
      value: undefined,
      selected: true,
    }]).concat(app.config.nodes.getAll().map((n) => ({
      name: 'node',
      label: `${n.chain.id} - ${n.url}`,
      value: n.id,
      selected: app.chain && app.chain.meta && n.url === app.chain.meta.url && n.chain === app.chain.meta.chain,
    })));

    return m('.SettingsWell', [
      m('form', [
        m('h4', 'Connect to'),
        m('.nodes', [
          m(DropdownFormField, {
            name: 'node',
            choices: nodes,
            callback: async (result) => {
              const n: NodeInfo = app.config.nodes.getById(result);
              await selectNode(n);
              m.route.set(`/${n.chain.id}/settings`);
            },
          }),
        ]),
        !vnode.state.showMoreSettings ? [
          m('a', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              vnode.state.showMoreSettings = true;
            }
          }, 'Show more settings'),
        ] : [
          m('h4', 'Composer'),
          m('.composer', [
            m(RadioSelectorFormField, {
              callback: async (value) => {
                await SettingsController.disableRichText(value !== 'richtext');
                notifySuccess('Setting saved');
              },
              choices: [
                { label: 'Rich Text', value: 'richtext', checked: !app.login.disableRichText },
                { label: 'Markdown', value: 'markdown', checked: app.login.disableRichText === true }
              ],
              name: 'composer',
            })
          ]),
        ],
      ]),
    ]);
  }
};

export default SettingsWell;
