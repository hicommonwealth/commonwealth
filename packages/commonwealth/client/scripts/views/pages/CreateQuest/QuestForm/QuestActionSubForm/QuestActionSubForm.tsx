import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { splitCamelOrPascalCase } from 'helpers/string';
import React from 'react';
import CWRepetitionCycleRadioButton from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { CWSelectList } from 'views/components/component_kit/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/CWTextInput';
import { withTooltip } from 'views/components/component_kit/CWTooltip';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWRadioButton } from 'views/components/component_kit/cw_radio_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { actionCopies } from '../../../QuestDetails/QuestActionCard/helpers';
import './QuestActionSubForm.scss';
import ActionContentIdScopeSelector from './SpecialCaseDynamicFields/ActionContentIdScopeSelector';
import AmountMultipler from './SpecialCaseDynamicFields/AmountMultipler';
import BasicPointsInput from './SpecialCaseDynamicFields/BasicPointsInput';
import ChainEventFields from './SpecialCaseDynamicFields/ChainEventFields';
import CommunityGoals from './SpecialCaseDynamicFields/CommunityGoal';
import ContentIdInput from './SpecialCaseDynamicFields/ContentIdInput';
import CreatorPointsInput from './SpecialCaseDynamicFields/CreatorPointsInput';
import StartLinkInput from './SpecialCaseDynamicFields/StartLinkInput';
import TwitterFields from './SpecialCaseDynamicFields/TwitterFields';
import { QuestAction, QuestActionSubFormProps } from './types';
import useQuestActionSubForm from './useQuestActionSubForm';

const QuestActionSubForm = (props: QuestActionSubFormProps) => {
  const {
    config,
    defaultValues,
    errors,
    isRemoveable = true,
    onChange,
    onRemove,
  } = props;

  const {
    doesActionPreventRepetition,
    repetitionCycleRadio,
    actionOptions,
    hasContentIdField,
  } = useQuestActionSubForm(props);

  const instructionsLinkSpan = (() => {
    if (config?.requires_amount_multipler && !config?.requires_creator_points)
      return `span-6`;
    return hasContentIdField ? 'span-3' : 'span-6';
  })();

  return (
    <div className={clsx('QuestActionSubForm', { isRemoveable })}>
      {isRemoveable && (
        <CWIconButton
          iconName="close"
          onClick={onRemove}
          className="ml-auto cursor-pointer remove-btn span-6"
        />
      )}

      <div className="repeatition-selector span-6">
        <CWText type="caption" fontWeight="semiBold">
          Action Schedule
        </CWText>
        {withTooltip(
          <CWRepetitionCycleRadioButton
            customError={repetitionCycleRadio.error}
            {...repetitionCycleRadio.props}
            className="radio-btn mt-8"
            value={QuestParticipationLimit.OncePerPeriod}
            groupName={`participationLimit-${defaultValues?.action}`}
            {...(defaultValues?.participationLimit ===
              QuestParticipationLimit.OncePerPeriod && {
              checked: true,
            })}
            onChange={(e) =>
              e.target.checked &&
              onChange?.({
                participationLimit: QuestParticipationLimit.OncePerPeriod,
              })
            }
            disabled={doesActionPreventRepetition}
          />,
          `Selected action does not allow repetition`,
          doesActionPreventRepetition,
          'w-fit',
        )}
        <CWRadioButton
          className="radio-btn"
          value={QuestParticipationLimit.OncePerQuest}
          label="One time only"
          groupName={`participationLimit-${defaultValues?.action}`}
          {...(defaultValues?.participationLimit ===
            QuestParticipationLimit.OncePerQuest && {
            checked: true,
          })}
          onChange={(e) =>
            e.target.checked &&
            onChange?.({
              participationLimit: QuestParticipationLimit.OncePerQuest,
            })
          }
        />
      </div>

      <CWSelectList
        isClearable={false}
        label="Action"
        placeholder="Select an action"
        name="action"
        containerClassname="span-6"
        options={actionOptions}
        onChange={(newValue) =>
          newValue &&
          onChange?.({ action: newValue.value, contentIdentifier: '' })
        }
        {...(defaultValues?.action && {
          value: {
            value: defaultValues?.action as QuestAction,
            label: splitCamelOrPascalCase(defaultValues?.action),
          },
        })}
        customError={errors?.action}
        instructionalMessage={
          ((defaultValues?.action === 'TweetEngagement' ||
            defaultValues?.action === 'DiscordServerJoined') &&
            actionCopies.pre_reqs[defaultValues?.action as QuestAction](
              'admin',
            )) ||
          ''
        }
      />

      {
        <>
          {/* Dynamic fields below:
            1. Each field/group is rendered independently if current config allows
            2. Rendering logic is validated by their internal state
          */}
          <BasicPointsInput
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <CreatorPointsInput
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <AmountMultipler
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <TwitterFields
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <ChainEventFields
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <StartLinkInput
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <ActionContentIdScopeSelector
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <CommunityGoals
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
          <ContentIdInput
            defaultValues={defaultValues}
            errors={errors}
            onChange={onChange}
            config={config}
          />
        </>
      }

      <CWTextInput
        label="Instructions Link (optional)"
        name="instructionsLink"
        placeholder="https://example.com"
        containerClassName={instructionsLinkSpan}
        fullWidth
        {...(defaultValues?.instructionsLink && {
          defaultValue: defaultValues?.instructionsLink,
        })}
        onInput={(e) =>
          onChange?.({ instructionsLink: e?.target?.value?.trim() })
        }
        customError={errors?.instructionsLink}
      />
    </div>
  );
};

export default QuestActionSubForm;
