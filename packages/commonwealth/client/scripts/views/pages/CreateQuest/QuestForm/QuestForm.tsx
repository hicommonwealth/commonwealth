import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { capitalize } from 'lodash';
import React from 'react';
import CWCommunityInput from 'views/components/CWCommunityInput';
import CWDateTimeInput from 'views/components/component_kit/CWDateTimeInput';
import {
  CWImageInput,
  ImageBehavior,
} from 'views/components/component_kit/CWImageInput';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import QuestActionSubForm, { QuestAction } from './QuestActionSubForm';
import './QuestForm.scss';
import { QuestFormProps, QuestTypes } from './types';
import useQuestForm from './useQuestForm';
import { buildDynamicQuestFormValidationSchema } from './validation';

const QuestForm = (props: QuestFormProps) => {
  const { mode, initialValues } = props;
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
    idealStartDate,
    minEndDate,
    availableQuestActions,
    formMethodsRef,
    minQuestLevelXP,
  } = useQuestForm(props);

  const popoverPropsQuestActions = usePopover();
  const popoverPropsQuestTypes = usePopover();
  const isUpdateMode = mode === 'update';

  return (
    <CWForm
      ref={formMethodsRef}
      validationSchema={buildDynamicQuestFormValidationSchema({
        max_xp_to_end_lower_limit: minQuestLevelXP || 0,
      })}
      onSubmit={handleSubmit}
      onErrors={validateSubForms}
      {...(initialValues
        ? {
            initialValues: {
              name: initialValues.name,
              description: initialValues.description,
              image: initialValues.image,
              start_date: initialValues.start_date,
              end_date: initialValues.end_date,
              community: initialValues.community,
              max_xp_to_end: initialValues.max_xp_to_end,
              quest_type: initialValues.quest_type,
            },
          }
        : {
            initialValues: {
              participation_limit: QuestParticipationLimit.OncePerQuest,
              quest_type: QuestTypes.Common,
            },
          })}
      className="QuestForm"
    >
      {({ watch }) => (
        <>
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
              label="Quest Image - Accepts JPG and PNG files - (optional)"
              onImageProcessingChange={({ isGenerating, isUploading }) => {
                setIsProcessingQuestImage(isGenerating || isUploading);
              }}
              name="image"
              hookToForm
              imageBehavior={ImageBehavior.Fill}
              withAIImageGeneration
            />

            {withTooltip(
              <div
                className={clsx(
                  'quest-type-selector',
                  isUpdateMode && 'update-mode',
                )}
              >
                <CWText type="b1" fontWeight="semiBold">
                  Quest Type&nbsp;
                  <CWPopover
                    body={
                      <div>
                        <CWText type="b1" fontWeight="semiBold">
                          Common Quests:
                        </CWText>
                        <br />
                        <CWText type="b2">
                          Common Quests are for events that happen on Common
                          such as Threads, Comments, and Common Protocol events
                          like Namespace Creation and more
                        </CWText>
                        <br />

                        <CWText type="b1" fontWeight="semiBold">
                          Channel Quests:
                        </CWText>
                        <br />
                        <CWText type="b2">
                          Channel Quests are external integrations such as to
                          Twitter and Chain Events.
                        </CWText>
                      </div>
                    }
                    {...popoverPropsQuestTypes}
                  />
                  <CWIconButton
                    iconName="question"
                    onMouseEnter={popoverPropsQuestTypes.handleInteraction}
                    onMouseLeave={popoverPropsQuestTypes.handleInteraction}
                  />
                </CWText>
                <CWRadioButton
                  className="radio-btn mt-8"
                  value={QuestTypes.Common}
                  label="Common Quest"
                  name="quest_type"
                  hookToForm
                  groupName="quest_type"
                  disabled={isUpdateMode}
                />
                <CWRadioButton
                  className="radio-btn"
                  value={QuestTypes.Channel}
                  label="Channel Quest"
                  name="quest_type"
                  hookToForm
                  groupName="quest_type"
                  disabled={isUpdateMode}
                />
              </div>,
              'Change not allowed during update',
              isUpdateMode,
            )}

            <CWCommunityInput
              key={`${watch('community')}`}
              name="community"
              hookToForm
              label="Community (optional)"
              instructionalMessage="Note: Selecting a community will bind all quest actions to that community."
              isClearable
            />
          </div>

          <CWDivider />

          <div className="quest-period-section">
            <CWText type="b1" fontWeight="semiBold">
              Quest timeline
            </CWText>
            <CWDateTimeInput
              autoComplete="off"
              label="Start Date"
              hookToForm
              name="start_date"
              minDate={minStartDate}
              selected={idealStartDate}
              showTimeInput
            />
            <CWDateTimeInput
              autoComplete="off"
              label="End Date"
              hookToForm
              name="end_date"
              minDate={minEndDate}
              selected={null}
              showTimeInput
            />
          </div>

          <CWDivider />

          <div className="xp-configuration-section">
            <CWText type="b1" fontWeight="semiBold">
              Aura Configuration
            </CWText>

            <CWTextInput
              label="Aura limit"
              placeholder="Aura limit"
              fullWidth
              name="max_xp_to_end"
              hookToForm
              // eslint-disable-next-line max-len
              instructionalMessage={`Maximum Aura that will be awarded for this quest before marking it as complete. ${watch('quest_type') === QuestTypes.Channel ? `This doesn't apply to 'Tweet Engagement' actions.` : ''}`}
            />
          </div>

          <CWDivider />

          <div className="actions-section">
            <div className="header">
              <CWText type="b1" fontWeight="semiBold">
                Actions&nbsp;
                <CWPopover
                  body={
                    <div>
                      <CWText type="b2">
                        Quest actions engage users to complete specific tasks.
                      </CWText>
                      <br />

                      <CWText type="b2" fontWeight="semiBold">
                        Examples:
                      </CWText>
                      <br />

                      <CWText type="b2">
                        &#9679; Join &apos;Common&apos; Community to earn 70
                        Aura
                      </CWText>

                      <CWText type="b2">
                        &#9679; Participate in any contest to earn 90 Aura
                      </CWText>
                    </div>
                  }
                  {...popoverPropsQuestActions}
                />
                <CWIconButton
                  iconName="question"
                  onMouseEnter={popoverPropsQuestActions.handleInteraction}
                  onMouseLeave={popoverPropsQuestActions.handleInteraction}
                />
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
                config={subForm.config}
                onChange={(updateBody) =>
                  updateSubFormByIndex(updateBody, index)
                }
                isRemoveable={questActionSubForms.length !== MIN_ACTIONS_LIMIT}
                onRemove={() => removeSubFormByIndex(index)}
                availableActions={availableQuestActions}
                hiddenActions={
                  questActionSubForms
                    .filter((form) => !!form.values.action)
                    .map((form) => form.values.action) as QuestAction[]
                }
                internalRefs={subForm.refs}
              />
            ))}

            {withTooltip(
              <CWButton
                containerClassName="add-action-btn-outline"
                className="add-action-btn"
                label="Add action"
                buttonWidth="full"
                type="button"
                buttonAlt="green"
                onClick={addSubForm}
                disabled={questActionSubForms.length >= MAX_ACTIONS_LIMIT}
              />,
              'Cannot add more actions',
              questActionSubForms.length >= MAX_ACTIONS_LIMIT,
            )}
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
              label={`${capitalize(mode)} Quest`}
              buttonWidth="wide"
              type="submit"
              containerClassName="btn"
              disabled={isProcessingQuestImage}
            />
          </div>
        </>
      )}
    </CWForm>
  );
};

export default QuestForm;
