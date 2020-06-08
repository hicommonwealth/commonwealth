import 'components/settings/settings_well.scss';

import { default as m } from 'mithril';
import app from 'state';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { selectNode } from 'app';
import { NodeInfo } from 'models';

interface IState {
  initialized: boolean;
  showMoreSettings: boolean;
}

const GithubWell: m.Component<{}, IState> = {
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

    return m('.GithubWell', [
      m('form', [
        m('h4', 'Email'),
        m('input[type="email"]', {
          value: app.login.socialAccounts || 'None'
        }),
      ]),
    ]);
  }
};

export default GithubWell;
