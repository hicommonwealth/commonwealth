import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { getDecimals } from 'helpers';
import 'modals/edit_topic_thresholds_modal.scss';
import React from 'react';
import app from 'state';
import {
  useFetchTopicsQuery,
  useSetTopicThresholdMutation,
} from 'state/api/topics';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import type Topic from '../../models/Topic';
import Permissions from '../../utils/Permissions';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWText } from '../components/component_kit/cw_text';

type EditTopicThresholdsRowProps = {
  topic: Topic;
  onClose: () => void;
};

const EditTopicThresholdsRow = ({
  topic,
  onClose,
}: EditTopicThresholdsRowProps) => {
  const [newTokenThresholdInWei, setNewTokenThresholdInWei] =
    React.useState<string>();
  const { mutateAsync: setTopicThreshold } = useSetTopicThresholdMutation();

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
              await setTopicThreshold({
                topic,
                topicThreshold: newTokenThresholdInWei,
              });
              onClose();
              notifySuccess('Successfully updated threshold value');
            } catch (err) {
              notifyError(
                err?.response?.data?.error ||
                  err?.message ||
                  'Invalid threshold value'
              );
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

export const EditTopicThresholdsModal = ({
  onModalClose,
}: EditTopicThresholdsModalProps) => {
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  if (!(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())) {
    return null;
  }

  return (
    <div className="EditTopicThresholdsModal">
      <div className="compact-modal-title">
        <h3>Edit topic thresholds</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
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
              return (
                <EditTopicThresholdsRow
                  topic={topic}
                  key={topic.id}
                  onClose={onModalClose}
                />
              );
            })
        ) : (
          <CWText>There are no topics in this community yet</CWText>
        )}
      </div>
    </div>
  );
};
