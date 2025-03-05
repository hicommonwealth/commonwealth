import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { splitCamelOrPascalCase } from 'helpers/string';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './QuestActionSubForm.scss';
import { doesActionRewardShareForReferrer } from './helpers';
import { QuestAction, QuestActionSubFormProps } from './types';

const QuestActionSubForm = ({
  isRemoveable = true,
  onRemove,
  errors,
  defaultValues,
  config,
  onChange,
  hiddenActions,
}: QuestActionSubFormProps) => {
  const actionOptions = [
    'CommunityCreated',
    'CommunityJoined',
    'ThreadCreated',
    'ThreadUpvoted',
    'CommentCreated',
    'CommentUpvoted',
    'WalletLinked',
    'SSOLinked',
  ]
    .map((event) => ({
      value: event as QuestAction,
      label: splitCamelOrPascalCase(event),
    }))
    .filter(
      (action) =>
        !(hiddenActions || []).includes(action.value) &&
        action.value !== 'UserMentioned',
    );

  const placeholders = {
    sampleThreadLink: `https://${PRODUCTION_DOMAIN}/discussion/25730`,
    sampleCommentLink: `https://${PRODUCTION_DOMAIN}/discussion/25730?comment=89775`,
  };

  return (
    <div className={clsx('QuestActionSubForm', { isRemoveable })}>
      {isRemoveable && (
        <CWIconButton
          iconName="close"
          onClick={onRemove}
          className="ml-auto cursor-pointer remove-btn"
        />
      )}

      <CWSelectList
        isClearable={false}
        label="Action"
        placeholder="Select an action"
        name="action"
        options={actionOptions}
        onChange={(newValue) =>
          newValue && onChange?.({ action: newValue.value })
        }
        {...(defaultValues?.action && {
          value: {
            value: defaultValues?.action as QuestAction,
            label: splitCamelOrPascalCase(defaultValues?.action),
          },
        })}
        customError={errors?.action}
      />

      <div
        className={clsx(
          'grid-row',
          config?.requires_creator_points ? 'cols-2' : 'cols-1',
        )}
      >
        <CWTextInput
          label="Total Reward Points"
          placeholder="Points Earned"
          fullWidth
          {...(defaultValues?.rewardAmount && {
            defaultValue: defaultValues?.rewardAmount,
          })}
          onInput={(e) =>
            onChange?.({ rewardAmount: e?.target?.value?.trim() })
          }
          name="rewardAmount"
          customError={errors?.rewardAmount}
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
      </div>

      <div
        className={clsx(
          'grid-row',
          config?.with_optional_comment_id || config?.with_optional_thread_id
            ? 'cols-2'
            : 'cols-1',
        )}
      >
        {(config?.with_optional_comment_id ||
          config?.with_optional_thread_id) && (
          <CWTextInput
            label={`${config?.with_optional_thread_id ? 'Thread' : 'Comment'} link`}
            name="contentLink"
            placeholder={
              config?.with_optional_thread_id
                ? placeholders.sampleThreadLink
                : placeholders.sampleCommentLink
            }
            fullWidth
            {...(defaultValues?.contentLink && {
              defaultValue: defaultValues?.contentLink,
            })}
            onInput={(e) =>
              onChange?.({ contentLink: e?.target?.value?.trim() })
            }
            customError={errors?.contentLink}
          />
        )}

        <CWTextInput
          label="Instructions Link (optional)"
          name="instructionsLink"
          placeholder="https://example.com"
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
    </div>
  );
};

export default QuestActionSubForm;
