/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'modals/edit_topic_thresholds_modal.scss';

import app from 'state';
import { Topic } from 'models';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';

type EditTopicThresholdsRowAttrs = {
  topic: Topic;
};

class EditTopicThresholdsRow extends ClassComponent<EditTopicThresholdsRowAttrs> {
  private newTokenThresholdInWei: string;

  view(vnode: m.Vnode<EditTopicThresholdsRowAttrs>) {
    const { topic } = vnode.attrs;

    if (typeof this.newTokenThresholdInWei !== 'string') {
      this.newTokenThresholdInWei = topic.tokenThreshold?.toString() || '0';
    }

    const decimals = app.chain?.meta?.decimals
      ? chainState.chain.meta.decimals
      : chainState.chain.network === ChainNetwork.ERC721
      ? 0
      : chainState.chain.base === ChainBase.CosmosSDK
      ? 6
      : 18;

    return (
      <div class="EditTopicThresholdsRow">
        <CWText>{topic.name}</CWText>
        <div class="input-and-button-row">
          <TokenDecimalInput
            decimals={decimals}
            defaultValueInWei={topic.tokenThreshold.toString()}
            onInputChange={(newValue: string) => {
              this.newTokenThresholdInWei = newValue;
            }}
          />
          <CWButton
            label="Update"
            disabled={!this.newTokenThresholdInWei}
            onclick={async (e) => {
              e.preventDefault();
              try {
                const status = await app.topics.setTopicThreshold(
                  topic,
                  this.newTokenThresholdInWei
                );
                if (status === 'Success') {
                  notifySuccess('Successfully updated threshold value');
                } else {
                  notifyError('Could not update threshold value');
                }
              } catch (err) {
                notifyError(`Invalid threshold value: ${err.message}`);
              }
            }}
          />
        </div>
      </div>
    );
  }
}

type NewTopicModalForm = {
  description: string;
  id: number;
  name: string;
  tokenThreshold: number;
};

type EditTopicThresholdsModalAttrs = {
  id: number;
  name: string;
  description: string;
  tokenThreshold: number;
};

export class EditTopicThresholdsModal extends ClassComponent<EditTopicThresholdsModalAttrs> {
  private form: NewTopicModalForm;

  view(vnode: m.Vnode<EditTopicThresholdsModalAttrs>) {
    if (
      !app.user.isSiteAdmin &&
      !app.roles.isAdminOfEntity({ chain: navState.activeChainId() })
    )
      return null;
    const { id, name, description, tokenThreshold } = vnode.attrs;

    if (!this.form) {
      this.form = { id, name, description, tokenThreshold };
    }

    const topics = app.topics.getByCommunity(navState.activeChainId());

    return (
      <div class="EditTopicThresholdsModal">
        <div class="compact-modal-title">
          <h3>Edit topic thresholds</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          {topics.length > 0 ? (
            topics
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
                return <EditTopicThresholdsRow topic={topic} />;
              })
          ) : (
            <CWText>There are no topics in this community yet</CWText>
          )}
        </div>
      </div>
    );
  }
}
