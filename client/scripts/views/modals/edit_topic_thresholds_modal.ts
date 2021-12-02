import 'modals/edit_topic_thresholds_modal.scss';
import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import { Button, Switch, Input, Form } from 'construct-ui';

import { OffchainTopic } from 'models';
import { CompactModalExitButton } from 'views/modal';
import { tokensToTokenBaseUnits, tokenBaseUnitsToTokens } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

interface INewTopicModalForm {
  id: number,
  name: string,
  description: string,
  tokenThreshold: number
}

const EditTopicThresholdsRow: m.Component<{
  topic: OffchainTopic
}, {
  newTokenThreshold: string,
  useBaseToken: boolean,
  switchCaption: string,
}> = {
  oninit: (vnode) => {
    const { topic } = vnode.attrs;
    const decimals = app.chain?.meta.chain?.decimals ? app.chain.meta.chain.decimals : 18;
    if (vnode.state.newTokenThreshold === null || vnode.state.newTokenThreshold === undefined) {
      vnode.state.newTokenThreshold = topic.tokenThreshold
        ? tokenBaseUnitsToTokens(topic.tokenThreshold.toString(), decimals) : '0';
    }
    vnode.state.useBaseToken = false;
    vnode.state.switchCaption = `Using ${decimals} decimal precision`;
  },
  view: (vnode) => {
    const { topic } = vnode.attrs;
    const decimals = app.chain?.meta.chain?.decimals ? app.chain.meta.chain.decimals : 18;

    return m(Form, [
      m('.topic-name', [topic.name]),
      m(Input, {
        title: '',
        value: vnode.state.newTokenThreshold,
        type: 'number',
        oninput: (v) => {
          const threshold: string = (v.target as any).value;
          vnode.state.newTokenThreshold = threshold;
        },
      }),
      m(Button, {
        label: 'Update',
        intent: 'primary',
        rounded: true,
        disabled: !vnode.state.newTokenThreshold,
        onclick: async (e) => {
          e.preventDefault();
          try {
            // always convert to base token
            const amount = vnode.state.useBaseToken
              ? vnode.state.newTokenThreshold.toString()
              : tokensToTokenBaseUnits(vnode.state.newTokenThreshold.toString(), decimals);
            const status = await app.topics.setTopicThreshold(topic, amount);
            if (status === 'Success') {
              notifySuccess('Successfully updated threshold value');
            } else {
              notifyError('Could not update threshold value');
            }
          } catch (err) {
            notifyError(`Invalid threshold value: ${err.message}`);
          }
        },
      }),
      m('span.token-settings', [
        m(Switch, {
          title: '',
          defaultValue: vnode.state.useBaseToken,
          onchange: () => {
            vnode.state.useBaseToken = !vnode.state.useBaseToken;
            if (vnode.state.useBaseToken) {
              vnode.state.switchCaption = 'Using base token value';
              if (vnode.state.newTokenThreshold) {
                vnode.state.newTokenThreshold = tokensToTokenBaseUnits(
                  vnode.state.newTokenThreshold,
                  decimals
                );
              }
            } else {
              vnode.state.switchCaption = `Using ${decimals} decimal precision`;
              if (vnode.state.newTokenThreshold) {
                vnode.state.newTokenThreshold = tokenBaseUnitsToTokens(
                  vnode.state.newTokenThreshold,
                  decimals
                );
              }
            }
          },
        }),
        m('.switch-caption', vnode.state.switchCaption),
      ])
    ]);
  }
};

const EditTopicThresholdsModal: m.Component<{
  id: number,
  name: string,
  description: string,
  tokenThreshold: number
}, {
  error: any,
  form: INewTopicModalForm,
  saving: boolean,
}> = {
  view: (vnode) => {
    if (!app.user.isSiteAdmin
      && !app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, tokenThreshold } = vnode.attrs;

    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, tokenThreshold };
    }

    const topics =  app.topics.getByCommunity(app.activeId());

    return m('.EditTopicThresholdsModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit topic thresholds'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', topics.length > 0 ? topics.sort((a, b) => {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      }).map((topic) => {
        return m(EditTopicThresholdsRow, { topic });
      })
        : 'There are no topics in this community yet')
    ]);
  }
};

export default EditTopicThresholdsModal;
