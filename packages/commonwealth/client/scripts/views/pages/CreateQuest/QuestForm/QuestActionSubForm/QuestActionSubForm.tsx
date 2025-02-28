import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { splitCamelOrPascalCase } from 'helpers/string';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './QuestActionSubForm.scss';
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
    'ExternalXPChainEvent', // temp added here
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

  const ethereumChainOptions = Object.entries(commonProtocol.ValidChains).map(
    ([k, v]) => ({
      value: v as number,
      label: `${v} (${k})`,
    }),
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
            label="Creater Reward Share"
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
            instructionalMessage="Reward points for action creator. Deducted from total reward points."
          />
        )}
      </div>

      {defaultValues?.action === 'ExternalXPChainEvent' && (
        <div className="grid-row cols-2">
          <CWSelectList
            isClearable={false}
            label="Ethereum Chain"
            placeholder="Select a chain"
            name="ethChainId"
            options={ethereumChainOptions}
            onChange={(newValue) =>
              newValue && onChange?.({ ethChainId: newValue.value })
            }
            {...(defaultValues?.ethChainId && {
              value: {
                value: defaultValues?.ethChainId,
                label: splitCamelOrPascalCase(defaultValues?.ethChainId),
              },
            })}
            customError={errors?.ethChainId}
          />

          <CWTextInput
            label="Contract Address"
            name="contractAddress"
            placeholder="0x6b3595068778dd592e39a122f4f5a5cf09c90fe2"
            fullWidth
            {...(defaultValues?.contractAddress && {
              defaultValue: defaultValues?.contractAddress,
            })}
            onInput={(e) =>
              onChange?.({ contractAddress: e?.target?.value?.trim() })
            }
            customError={errors?.contractAddress}
          />
        </div>
      )}

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
