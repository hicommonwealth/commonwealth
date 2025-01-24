import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import React from 'react';
import CWDateTimeInput from 'views/components/component_kit/CWDateTimeInput';
import {
  CWImageInput,
  ImageBehavior,
} from 'views/components/component_kit/CWImageInput';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import './CreateQuestForm.scss';
import QuestActionSubForm, { QuestAction } from './QuestActionSubForm';
import useCreateQuestForm from './useCreateQuestForm';
import { questFormValidationSchema } from './validation';

const CreateQuestForm = () => {
  const {
    addSubForm,
    questActionSubForms,
    removeSubFormByIndex,
    updateSubFormByIndex,
    MAX_ACTIONS_LIMIT,
    MIN_ACTIONS_LIMIT,
    validateSubForms,
    handleSubmit,
    isProcessingQuestImage,
    setIsProcessingQuestImage,
    minStartDate,
  } = useCreateQuestForm();

  return (
    <CWForm
      validationSchema={questFormValidationSchema}
      onSubmit={handleSubmit}
      onErrors={validateSubForms}
      className="CreateQuestForm"
    >
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
            name="participation_limit"
            hookToForm
          />
          <CWRadioButton
            className="radio-btn"
            value={QuestParticipationLimit.OncePerQuest}
            label="One time only"
            groupName="quest"
            name="participation_limit"
            hookToForm
            checked
          />
        </div>
        <CWDateTimeInput
          label="Start Date"
          hookToForm
          name="start_date"
          minDate={minStartDate}
          selected={minStartDate}
        />
        <CWDateTimeInput
          label="End Date"
          hookToForm
          name="end_date"
          minDate={minStartDate}
          selected={null}
        />
      </div>

      <CWDivider />

      <div className="basic-information-section">
        <CWText type="b1" fontWeight="semiBold">
          Basic information
        </CWText>

        <CWTextInput
          label="Quest name"
          placeholder="Quest name"
          fullWidth
          name="name"
          hookToForm
        />

        <CWTextArea
          label="Description"
          placeholder="Add a description for your Quest"
          name="description"
          hookToForm
        />

        <CWImageInput
          label="Quest Image (Accepts JPG and PNG files)"
          onImageProcessingChange={({ isGenerating, isUploading }) => {
            setIsProcessingQuestImage(isGenerating || isUploading);
          }}
          name="image"
          hookToForm
          imageBehavior={ImageBehavior.Fill}
          withAIImageGeneration
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
          name="reward_amount"
          hookToForm
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

        {questActionSubForms.map((subForm, index) => (
          <QuestActionSubForm
            key={subForm.id}
            errors={subForm.errors}
            defaultValues={subForm.values}
            onChange={(updateBody) => updateSubFormByIndex(updateBody, index)}
            isRemoveable={questActionSubForms.length !== MIN_ACTIONS_LIMIT}
            onRemove={() => removeSubFormByIndex(index)}
            hiddenActions={
              questActionSubForms
                .filter((form) => !!form.values.action)
                .map((form) => form.values.action) as QuestAction[]
            }
          />
        ))}

        <CWButton
          containerClassName="add-action-btn-outline"
          className="add-action-btn"
          label="Add action"
          buttonWidth="full"
          type="button"
          buttonAlt="green"
          onClick={addSubForm}
          disabled={questActionSubForms.length >= MAX_ACTIONS_LIMIT}
        />
      </div>

      <CWDivider />

      <div className="action-btns">
        <CWButton
          label="Back"
          buttonType="secondary"
          buttonWidth="wide"
          type="button"
          containerClassName="btn"
        />
        <CWButton
          label="Create Quest"
          buttonWidth="wide"
          type="submit"
          containerClassName="btn"
          disabled={isProcessingQuestImage}
        />
      </div>
    </CWForm>
  );
};

export default CreateQuestForm;
