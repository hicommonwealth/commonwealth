import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import React, { useState } from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import './CreateQuestForm.scss';

const MAX_ACTIONS_LIMIT = 8;

const CreateQuestForm = () => {
  const [subActions] = useState([]);

  return (
    <CWForm validationSchema={{} as any} className="CreateQuestForm">
      <div className="quest-period-section">
        <div className="repeatition-selector">
          <CWText type="b1" fontWeight="semiBold">
            Quests can be completed by members
          </CWText>
          <CWRadioButton
            className="radio-btn"
            value={QuestParticipationLimit.OncePerPeriod}
            label="Repeatable daily"
            groupName="quest"
          />
          <CWRadioButton
            className="radio-btn"
            value={QuestParticipationLimit.OncePerQuest}
            label="One time only"
            groupName="quest"
          />
        </div>
        {/* TODO: need a proper input for dates */}
        <CWTextInput label="Start Date" placeholder="TODO" />
        <CWTextInput label="End Date" placeholder="TODO" />
      </div>

      <CWDivider />

      <div className="basic-information-section">
        <CWText type="b1" fontWeight="semiBold">
          Basic information
        </CWText>

        <CWTextInput label="Quest name" placeholder="Quest name" fullWidth />

        <CWTextArea
          label="Description (Optional)"
          placeholder="Add a description for your Quest"
        />
      </div>

      <CWDivider />

      <div className="reward-section">
        <CWText type="b1" fontWeight="semiBold">
          Reward
        </CWText>

        <CWTextInput
          label="Points Earned"
          placeholder="Amount per action"
          fullWidth
        />
      </div>

      <CWDivider />

      <div className="actions-section">
        <div className="header">
          <CWText type="b1" fontWeight="semiBold">
            Actions
          </CWText>
          <CWText type="b2">
            Add actions that users should take to earn points
          </CWText>
        </div>

        {/* TODO: action sub-form here */}

        <CWButton
          className="add-action-btn"
          label="Add action"
          buttonWidth="full"
          type="submit"
          buttonAlt="green"
          disabled={subActions.length >= MAX_ACTIONS_LIMIT}
        />
      </div>

      <CWDivider />

      <div className="action-btns">
        <CWButton
          label="Back"
          buttonType="secondary"
          buttonWidth="wide"
          type="button"
        />
        <CWButton label="Create Quest" buttonWidth="wide" type="submit" />
      </div>
    </CWForm>
  );
};

export default CreateQuestForm;
