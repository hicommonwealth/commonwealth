import 'modals/edit_topic_thresholds_modal.scss';
import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import { Button, Form } from 'construct-ui';

import { OffchainTopic } from 'models';
import { ChainNetwork } from 'types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import TokenDecimalInput from 'views/components/token_decimal_input';
import { CompactModalExitButton } from 'views/components/component_kit/cw_modal';

interface INewTopicModalForm {
  id: number;
  name: string;
  description: string;
  tokenThreshold: number;
}

const EditTopicThresholdsRow: m.Component<
  {
    topic: OffchainTopic;
  },
  {
    newTokenThresholdInWei: string;
  }
> = {
  view: (vnode) => {
    const { topic } = vnode.attrs;
    if (typeof vnode.state.newTokenThresholdInWei !== 'string') {
      vnode.state.newTokenThresholdInWei =
        topic.tokenThreshold?.toString() || '0';
    }
    const decimals = app.chain?.meta.chain?.decimals
      ? app.chain.meta.chain.decimals
      : (app.chain.network === ChainNetwork.ERC721) ? 0 : 18;
    return m(Form, [
      m('.topic-name', [topic.name]),
      m(TokenDecimalInput, {
        decimals,
        defaultValueInWei: topic.tokenThreshold.toString(),
        onInputChange: (newValue: string) => {
          vnode.state.newTokenThresholdInWei = newValue;
        },
      }),
      m(Button, {
        label: 'Update',
        intent: 'primary',
        rounded: true,
        disabled: !vnode.state.newTokenThresholdInWei,
        onclick: async (e) => {
          e.preventDefault();
          try {
            const status = await app.topics.setTopicThreshold(
              topic,
              vnode.state.newTokenThresholdInWei
            );
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
    ]);
  },
};

const EditTopicThresholdsModal: m.Component<
  {
    id: number;
    name: string;
    description: string;
    tokenThreshold: number;
  },
  {
    error: any;
    form: INewTopicModalForm;
    saving: boolean;
  }
> = {
  view: (vnode) => {
    if (
      !app.user.isSiteAdmin &&
      !app.user.isAdminOfEntity({ chain: app.activeChainId() })
    )
      return null;
    const { id, name, description, tokenThreshold } = vnode.attrs;

    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, tokenThreshold };
    }

    const topics = app.topics.getByCommunity(app.activeChainId());

    return m('.EditTopicThresholdsModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit topic thresholds'),
        m(CompactModalExitButton),
      ]),
      m(
        '.compact-modal-body',
        topics.length > 0
          ? topics
              .sort((a, b) => {
                if (a.name < b.name) {
                  return -1;
                }
                if (a.name > b.name) {
                  return 1;
                }
                return 0;
              })
              .map((topic) => {
                return m(EditTopicThresholdsRow, { topic });
              })
          : 'There are no topics in this community yet'
      ),
    ]);
  },
};

export default EditTopicThresholdsModal;
