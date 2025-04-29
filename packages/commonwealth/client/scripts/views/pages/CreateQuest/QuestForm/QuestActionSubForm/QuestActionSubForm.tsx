import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { splitCamelOrPascalCase } from 'helpers/string';
import React from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import CWRepetitionCycleRadioButton from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { actionCopies } from '../../../QuestDetails/QuestActionCard/helpers';
import './QuestActionSubForm.scss';
import ActionContentIdScopeSelector from './SpecialCaseDynamicFields/ActionContentIdScopeSelector';
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

  const ethereumChains = fetchCachedNodes()?.filter(
    (chainNode) => !!chainNode.ethChainId && chainNode.alchemyMetadata,
  );

  const ethereumChainOptions = ethereumChains
    ?.map((chainNode) => ({
      value: chainNode.ethChainId as number,
      label: `${chainNode.name} - ${chainNode.ethChainId}`,
    }))
    ?.sort((a, b) => a.label.localeCompare(b.label));

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

      {
        <>
          {/* Dynamic fields below:
            1. Each field/group is rendered independently if current config allows
            2. Rendering logic is validated by their internal state
          */}
          {config?.requires_chain_event && (
            <>
              <div className="grid-row cols-2">
                <CWSelectList
                  key={`ethChainId-${defaultValues?.action}`}
                  name="ethChainId"
                  isClearable={false}
                  label="Ethereum Chain"
                  placeholder="Select a chain"
                  options={ethereumChainOptions}
                  onChange={(newValue) =>
                    newValue && onChange?.({ ethChainId: `${newValue.value}` })
                  }
                  {...(defaultValues?.ethChainId && {
                    value: {
                      value: parseInt(`${defaultValues?.ethChainId}`),
                      label: `${
                        ethereumChains?.find(
                          (x) =>
                            x.ethChainId ===
                            parseInt(`${defaultValues?.ethChainId}`),
                        )?.name
                      } - ${defaultValues.ethChainId}`,
                    },
                  })}
                  customError={errors?.ethChainId}
                />
                <CWTextInput
                  key={`contractAddress-${defaultValues?.action}`}
                  name="contractAddress"
                  label="Contract Address"
                  placeholder="0x5C69bEe701ef814a2B6a3EDD4B2A6b45b6f72f2F"
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

              <div className="grid-row cols-2">
                <CWTextArea
                  key={`transactionHash-${defaultValues?.action}`}
                  name="transactionHash"
                  label="Transaction Hash"
                  placeholder="0xd2b4b1d70d7f76d55b524ea788ab85e9ab2d01d99ebbeedfb0b69ab0735bc5c9"
                  {...(defaultValues?.transactionHash && {
                    value: defaultValues?.transactionHash,
                  })}
                  onInput={(e) =>
                    onChange?.({ transactionHash: e?.target?.value?.trim() })
                  }
                  customError={errors?.transactionHash}
                />
                <CWTextArea
                  key={`eventSignature-${defaultValues?.action}`}
                  name="eventSignature"
                  label="Event Signature"
                  placeholder="event Transfer(address indexed from, address indexed to, uint256 value)"
                  {...(defaultValues?.eventSignature && {
                    value: defaultValues?.eventSignature,
                  })}
                  onInput={(e) =>
                    onChange?.({ eventSignature: e?.target?.value?.trim() })
                  }
                  customError={errors?.eventSignature}
                />
              </div>
            </>
          )}
          <CreatorPointsInput
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
