import React from 'react';

import { getDecimals } from 'helpers';
import { notifyError } from 'controllers/app/notifications';

import 'modals/edit_topic_thresholds_modal.scss';
import type Topic from '../../models/Topic';

import app from 'state';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import {
  useFetchTopicsQuery,
  useSetTopicThresholdMutation,
} from 'state/api/topics';

type EditTopicThresholdsRowProps = {
  topic: Topic;
};

const EditTopicThresholdsRow = (props: EditTopicThresholdsRowProps) => {
  const [newTokenThresholdInWei, setNewTokenThresholdInWei] =
    React.useState<string>();
  const { mutateAsync: setTopicThreshold } = useSetTopicThresholdMutation();
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
              await setTopicThreshold({
                topicId: topic.id,
                topicThreshold: newTokenThresholdInWei,
              });

              // TODO
              // if (status === 'Success') {
              //   notifySuccess('Successfully updated threshold value');
              // } else {
              //   notifyError('Could not update threshold value');
              // }
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
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  if (
    !app.user.isSiteAdmin &&
    !app.roles.isAdminOfEntity({ chain: app.activeChainId() })
  ) {
    return null;
  }

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
