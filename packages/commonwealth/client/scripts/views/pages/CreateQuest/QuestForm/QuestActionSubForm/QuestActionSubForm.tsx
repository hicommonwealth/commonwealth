import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { doesActionRewardShareForReferrer } from 'helpers/quest';
import { splitCamelOrPascalCase } from 'helpers/string';
import React from 'react';
import CWRepetitionCycleRadioButton from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { actionCopies } from '../../../QuestDetails/QuestActionCard/helpers';
import './QuestActionSubForm.scss';
import {
  QuestAction,
  QuestActionContentIdScope,
  QuestActionSubFormProps,
} from './types';
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
    inputConfigs,
    hasContentIdField,
    communityChainNodeSelectInputOptions,
  } = useQuestActionSubForm(props);

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

      <CWTextInput
        label="Total Reward Points"
        placeholder="Points Earned"
        fullWidth
        {...(defaultValues?.rewardAmount && {
          defaultValue: defaultValues?.rewardAmount,
        })}
        onInput={(e) => onChange?.({ rewardAmount: e?.target?.value?.trim() })}
        name="rewardAmount"
        customError={errors?.rewardAmount}
        containerClassName={
          config?.requires_creator_points ? 'span-3' : 'span-6'
        }
      />

      {config?.requires_creator_points && (
        <CWTextInput
          label={`${
            doesActionRewardShareForReferrer(
              defaultValues?.action as QuestAction,
            )
              ? 'Referrer'
              : 'Creater'
          } Reward Share`}
          placeholder="Points Earned"
          containerClassName="span-3"
          fullWidth
          {...(defaultValues?.creatorRewardAmount && {
            defaultValue: defaultValues?.creatorRewardAmount,
          })}
          onInput={(e) =>
            onChange?.({ creatorRewardAmount: e?.target?.value?.trim() })
          }
          name="creatorRewardAmount"
          customError={errors?.creatorRewardAmount}
          // eslint-disable-next-line max-len
          instructionalMessage={`Deducted from total reward points. ${
            doesActionRewardShareForReferrer(
              defaultValues?.action as QuestAction,
            )
              ? 'Only applied for referred user.'
              : ''
          }`}
        />
      )}

      {config?.requires_twitter_tweet_link && (
        <>
          <CWTextInput
            key={`noOfLikes-${defaultValues?.action}`}
            name="noOfLikes"
            label="Likes Count"
            placeholder="0"
            fullWidth
            {...(defaultValues?.noOfLikes !== 'undefiend' && {
              defaultValue: defaultValues?.noOfLikes,
            })}
            onInput={(e) => onChange?.({ noOfLikes: e?.target?.value?.trim() })}
            customError={errors?.noOfLikes}
            containerClassName="span-2"
          />
          <CWTextInput
            key={`noOfRetweets-${defaultValues?.action}`}
            name="noOfRetweets"
            label="Retweets Count"
            placeholder="0"
            fullWidth
            {...(defaultValues?.noOfRetweets !== 'undefiend' && {
              defaultValue: defaultValues?.noOfRetweets,
            })}
            onInput={(e) =>
              onChange?.({ noOfRetweets: e?.target?.value?.trim() })
            }
            customError={errors?.noOfRetweets}
            containerClassName="span-2"
          />
          <CWTextInput
            key={`noOfReplies-${defaultValues?.action}`}
            name="noOfReplies"
            label="Replies Count"
            placeholder="0"
            fullWidth
            {...(defaultValues?.noOfReplies !== 'undefiend' && {
              defaultValue: defaultValues?.noOfReplies,
            })}
            onInput={(e) =>
              onChange?.({ noOfReplies: e?.target?.value?.trim() })
            }
            customError={errors?.noOfReplies}
            containerClassName="span-2"
          />
        </>
      )}

      {config?.requires_start_link && (
        <CWTextInput
          label={inputConfigs.startLink.label}
          name="startLink"
          containerClassName="span-6"
          placeholder={inputConfigs.startLink.placeholder}
          fullWidth
          {...(defaultValues?.startLink && {
            defaultValue: defaultValues?.startLink,
          })}
          onInput={(e) => onChange?.({ startLink: e?.target?.value?.trim() })}
          customError={errors?.startLink}
        />
      )}

      {config?.with_optional_thread_id && (
        <div className="content-id-type-selector span-6">
          <CWText type="caption">Action Scope</CWText>
          <CWRadioButton
            className="radio-btn mt-8"
            value={QuestActionContentIdScope.Topic}
            label="Linked Topic"
            groupName={`contentIdScope-${defaultValues?.action}`}
            {...(defaultValues?.contentIdScope ===
              QuestActionContentIdScope.Topic && {
              checked: true,
            })}
            onChange={(e) =>
              e.target.checked &&
              onChange?.({
                contentIdentifier: '',
                contentIdScope: QuestActionContentIdScope.Topic,
              })
            }
          />
          <CWRadioButton
            className="radio-btn"
            value={QuestActionContentIdScope.Thread}
            label="Linked Thread"
            groupName={`contentIdScope-${defaultValues?.action}`}
            {...(defaultValues?.contentIdScope ===
              QuestActionContentIdScope.Thread && {
              checked: true,
            })}
            onChange={(e) =>
              e.target.checked &&
              onChange?.({
                contentIdentifier: '',
                contentIdScope: QuestActionContentIdScope.Thread,
              })
            }
          />
        </div>
      )}

      {hasContentIdField &&
        (config?.with_optional_chain_id ? (
          <CWSelectList
            isClearable={true}
            backspaceRemovesValue
            key={`contentIdentifier-${defaultValues?.action}`}
            name="contentIdentifier"
            label="Chain Node"
            placeholder="Select a chain node"
            containerClassname="span-3"
            options={communityChainNodeSelectInputOptions}
            onChange={(newValue) =>
              onChange?.({ contentIdentifier: `${newValue?.value || ''}` })
            }
            {...(defaultValues?.contentIdentifier && {
              value: {
                value: parseInt(`${defaultValues?.contentIdentifier}`),
                label: `${
                  communityChainNodeSelectInputOptions?.find(
                    (x) =>
                      x.value ===
                      parseInt(`${defaultValues?.contentIdentifier}`),
                  )?.label
                }`,
              },
            })}
            customError={errors?.contentIdentifier}
          />
        ) : (
          <CWTextInput
            key={`contentIdentifier-${defaultValues?.action}-${defaultValues?.contentIdScope}`}
            name="contentIdentifier"
            label={inputConfigs.contentId.label}
            placeholder={inputConfigs.contentId.placeholder}
            containerClassName="span-3"
            fullWidth
            {...(defaultValues?.contentIdentifier && {
              defaultValue: defaultValues?.contentIdentifier,
            })}
            onInput={(e) =>
              onChange?.({ contentIdentifier: e?.target?.value?.trim() })
            }
            customError={errors?.contentIdentifier}
          />
        ))}

      <CWTextInput
        label="Instructions Link (optional)"
        name="instructionsLink"
        placeholder="https://example.com"
        containerClassName={hasContentIdField ? 'span-3' : 'span-6'}
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
