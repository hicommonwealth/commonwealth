import React from 'react';

import {
  notifyError,
  notifySuccess,
} from '../../controllers/app/notifications';
import { getDecimals } from '../../helpers';
import type Topic from '../../models/Topic';
import app from '../../state';
import {
  useFetchTopicsQuery,
  useSetTopicThresholdMutation,
} from '../../state/api/topics';
import Permissions from '../../utils/Permissions';
import { CWText } from '../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { TokenDecimalInput } from '../components/token_decimal_input';

import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import '../../../styles/modals/edit_topic_thresholds_modal.scss';

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
          buttonHeight="sm"
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
                  'Invalid threshold value',
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
      <CWModalHeader
        label="Edit topic thresholds"
        onModalClose={onModalClose}
      />
      <CWModalBody className="EditTopicThresholdsBody">
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
      </CWModalBody>
    </div>
  );
};
