/* @jsx m */

import ClassComponent from 'class_component';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import m from 'mithril';

import 'modals/edit_topic_thresholds_modal.scss';
import type { Topic } from 'models';

import app from 'state';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
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

    let decimals;

    if (app.chain.meta.id === 'evmos') {
      // Custom for evmos
      decimals = 18;
    } else if (app.chain && app.chain.meta) {
      decimals = app.chain.meta.decimals;
    } else if (app.chain.network === ChainNetwork.ERC721) {
      decimals = 0;
    } else if (app.chain.base === ChainBase.CosmosSDK) {
      decimals = 6;
    }

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
      !app.roles.isAdminOfEntity({ chain: app.activeChainId() })
    )
      return null;
    const { id, name, description, tokenThreshold } = vnode.attrs;

    if (!this.form) {
      this.form = { id, name, description, tokenThreshold };
    }

    const topics = app.topics.getByCommunity(app.activeChainId());

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
