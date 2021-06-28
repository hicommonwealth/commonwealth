import 'modals/new_topic_modal.scss';
import 'modals/edit_token_thresholds_modal.scss';
import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Col, Input, Form, FormGroup, FormLabel, Grid, Spinner } from 'construct-ui';
import BN from 'bn.js';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CompactModalExitButton } from 'views/modal';
import { tokensToTokenBaseUnits, tokenBaseUnitsToTokens } from 'helpers';
import { OffchainTopic } from '../../models';

interface INewTopicModalForm {
  id: number,
  name: string,
  description: string,
  token_threshold: number
}

const EditTokenThresholdsRow: m.Component<{ topic: OffchainTopic }, { new_token_threshold: string }> = {
  view: (vnode) => {
    const { topic } = vnode.attrs;
    const decimals = app.chain.meta.chain.decimals ? app.chain.meta.chain.decimals : 18;

    if (!vnode.state.new_token_threshold) {
      vnode.state.new_token_threshold = tokenBaseUnitsToTokens(topic.token_threshold.toString(), decimals);
    }

    return m(Form, [
      m('.topic-name', [ topic.name ]),
      m('div',  [ m(Input, {
        value: vnode.state.new_token_threshold,
        oninput: (e) => {
          vnode.state.new_token_threshold = (e.target as any).value;
        },
      }),
      m(Button, {
        label: 'Update',
        intent: 'primary',
        rounded: true,
        onclick: async (e) => {
          e.preventDefault();
          app.topics.setTokenThreshold(topic, tokensToTokenBaseUnits(vnode.state.new_token_threshold.toString(), decimals));
        },
      })
      ]),
    ]);
  }
};

const EditTokenThresholdsModal: m.Component<{
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

    return m('.EditTokenThresholdsModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit token thresholds'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', topics.sort((a, b) => {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      }).map((topic) => {
        return m(EditTokenThresholdsRow, { topic });
      }))
    ]);
  }
};

export default EditTokenThresholdsModal;
