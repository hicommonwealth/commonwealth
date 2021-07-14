import 'modals/edit_topic_thresholds_modal.scss';
import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Col, Input, Form, FormGroup, FormLabel, Grid, Spinner } from 'construct-ui';
import BN from 'bn.js';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from 'views/modal';
import { tokensToTokenBaseUnits, tokenBaseUnitsToTokens } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { OffchainTopic } from '../../models';

interface INewTopicModalForm {
  id: number,
  name: string,
  description: string,
  token_threshold: number
}

const EditTopicThresholdsRow: m.Component<{ topic: OffchainTopic }, { new_token_threshold: string }> = {
  view: (vnode) => {
    const { topic } = vnode.attrs;
    const decimals = app.chain.meta.chain.decimals ? app.chain.meta.chain.decimals : 18;
    if (vnode.state.new_token_threshold === null || vnode.state.new_token_threshold === undefined) {
      console.log('!!topic.token_threshold == ', !!topic.token_threshold);

      vnode.state.new_token_threshold = topic.token_threshold
        ? tokenBaseUnitsToTokens(topic.token_threshold.toString(), decimals) : '0';
      console.log('vnode.state.new_token_threshold, ', vnode.state.new_token_threshold);

    }

    return m(Form, [
      m('.topic-name', [ topic.name ]),
      m('div',  [ m(Input, {
        value: vnode.state.new_token_threshold,
        oninput: (e) => {
          const threshold = (e.target as any).value;
          if (threshold.match(/^\d*?\.?\d*?$/)) {
            vnode.state.new_token_threshold = threshold;
          }
        },
      }),
      m(Button, {
        label: 'Update',
        intent: 'primary',
        rounded: true,
        onclick: async (e) => {
          e.preventDefault();
          app.topics.setTopicThreshold(topic,
            tokensToTokenBaseUnits(vnode.state.new_token_threshold.toString(), decimals))
            .then((status) => {
              if (status === 'Success') {
                notifySuccess('Successfully updated threshold value');
              } else {
                notifyError('Could not update threshold value');
              }
            });
        },
      }),
      ]),
    ]);
  }
};

const EditTopicThresholdsModal: m.Component<{
  id: number,
  name: string,
  description: string,
  token_threshold: number
}, {
  error: any,
  form: INewTopicModalForm,
  saving: boolean,
}> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, token_threshold } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, token_threshold };
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
