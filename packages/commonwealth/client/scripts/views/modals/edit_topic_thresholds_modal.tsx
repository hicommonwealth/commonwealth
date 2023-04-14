import { notifyError, notifySuccess } from 'controllers/app/notifications';

import { getDecimals } from 'helpers';

import 'modals/edit_topic_thresholds_modal.scss';
import React from 'react';

import app from 'state';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWText } from '../components/component_kit/cw_text';

type EditTopicThresholdsRowProps = {
  topic: Topic;
};

const EditTopicThresholdsRow = (props: EditTopicThresholdsRowProps) => {
  const [newTokenThresholdInWei, setNewTokenThresholdInWei] =
    React.useState<string>();

  const { topic } = props;

  if (typeof newTokenThresholdInWei !== 'string') {
    setNewTokenThresholdInWei(topic.tokenThreshold?.toString() || '0');
  }

  const decimals = getDecimals(app.chain);

  return (
    <div className="EditTopicThresholdsRow">
      <CWText>{topic.name}</CWText>
      <div className="input-and-button-row">
        <TokenDecimalInput
          decimals={decimals}
          defaultValueInWei={topic.tokenThreshold.toString()}
          onInputChange={(newValue: string) => {
            setNewTokenThresholdInWei(newValue);
          }}
        />
        <CWButton
          label="Update"
          disabled={!newTokenThresholdInWei}
          onClick={async (e) => {
            e.preventDefault();

            try {
              const status = await app.topics.setTopicThreshold(
                topic,
                newTokenThresholdInWei
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
};

type EditTopicThresholdsModalProps = {
  onModalClose: () => void;
};

export const EditTopicThresholdsModal = (
  props: EditTopicThresholdsModalProps
) => {
  if (
    !app.user.isSiteAdmin &&
    !app.roles.isAdminOfEntity({ chain: app.activeChainId() })
  ) {
    return null;
  }

  const topics = app.topics.getByCommunity(app.activeChainId());

  return (
    <div className="EditTopicThresholdsModal">
      <div className="compact-modal-title">
        <h3>Edit topic thresholds</h3>
        <CWIconButton iconName="close" onClick={() => props.onModalClose()} />
      </div>
      <div className="compact-modal-body">
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
              return <EditTopicThresholdsRow topic={topic} key={topic.id} />;
            })
        ) : (
          <CWText>There are no topics in this community yet</CWText>
        )}
      </div>
    </div>
  );
};
