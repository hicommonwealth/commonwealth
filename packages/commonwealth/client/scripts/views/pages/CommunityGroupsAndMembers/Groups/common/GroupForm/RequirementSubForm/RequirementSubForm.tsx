import { ChainBase } from '@hicommonwealth/shared';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import {
  CW_SPECIFICATIONS,
  ERC_SPECIFICATIONS,
  SOL_NFT_SPECIFICATION,
  SPL_SPECIFICATION,
  TOKENS,
  chainTypes,
  conditionTypes,
  requirementTypes,
} from '../../../../common/constants';
import { RequirementSubFormType } from '../index.types';
import './RequirementSubForm.scss';

const RequirementSubForm = ({
  errors,
  defaultValues = {},
  onRemove = () => null,
  isRemoveable = true,
  onChange = () => null,
}: RequirementSubFormType) => {
  const [requirementType, setRequirementType] = useState('');
  const isTokenRequirement = Object.values(TOKENS).includes(requirementType);
  const is1155Requirement = requirementType === ERC_SPECIFICATIONS.ERC_1155;
  const isCosmosRequirement =
    requirementType === TOKENS.COSMOS_TOKEN ||
    requirementType === CW_SPECIFICATIONS.CW_721 ||
    requirementType === CW_SPECIFICATIONS.CW_20;
  const isSPLRequirement =
    requirementType === SPL_SPECIFICATION ||
    requirementType === SOL_NFT_SPECIFICATION;
  const isSuiRequirement = requirementType === TOKENS.SUI_TOKEN;
  const isSuiTokenRequirement = requirementType === TOKENS.SUI_TOKEN_TYPE;
  const helperTextForAmount = {
    [TOKENS.EVM_TOKEN]: 'Using 18 decimal precision',
    [TOKENS.COSMOS_TOKEN]: 'Using 6 decimal precision',
    [TOKENS.SUI_TOKEN]: 'Using 9 decimal precision',
    [TOKENS.SUI_TOKEN_TYPE]: 'Using 9 decimal precision',
    [SPL_SPECIFICATION]: 'Using 6 decimal precision',
    [SOL_NFT_SPECIFICATION]: 'Using 6 decimal precision',
    [ERC_SPECIFICATIONS.ERC_20]: 'Using 18 decimal precision',
    [ERC_SPECIFICATIONS.ERC_721]: '',
    [CW_SPECIFICATIONS.CW_721]: '',
    [CW_SPECIFICATIONS.CW_20]: 'Using 6 decimal precision',
  };

  useEffect(() => {
    defaultValues?.requirementType?.value &&
      !requirementType &&
      setRequirementType(defaultValues?.requirementType?.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  return (
    <div className="RequirementSubForm">
      <div className="row-1">
        <CWSelectList
          key={defaultValues?.requirementType?.value}
          name="requirementType"
          label="Requirement type"
          placeholder="Requirement type"
          {...(defaultValues.requirementType && {
            defaultValue: [defaultValues.requirementType],
          })}
          options={requirementTypes
            .filter((x) =>
              app.chain.base === ChainBase.CosmosSDK
                ? [
                    TOKENS.COSMOS_TOKEN,
                    ...Object.values(CW_SPECIFICATIONS),
                  ].includes(x.value)
                : app.chain.base === ChainBase.Solana
                  ? [SPL_SPECIFICATION].includes(x.value) ||
                    [SOL_NFT_SPECIFICATION].includes(x.value)
                  : app.chain.base === ChainBase.Sui
                    ? [TOKENS.SUI_TOKEN, TOKENS.SUI_TOKEN_TYPE].includes(
                        x.value,
                      )
                    : [
                        TOKENS.EVM_TOKEN,
                        ...Object.values(ERC_SPECIFICATIONS),
                      ].includes(x.value),
            )
            .map((requirement) => ({
              label: requirement.label,
              value: requirement.value,
            }))}
          onChange={(newValue) => {
            // @ts-expect-error <StrictNullChecks/>
            setRequirementType(newValue.value);

            onChange({
              // @ts-expect-error <StrictNullChecks/>
              requirementType: newValue.value,
            });
          }}
          className="w-350"
          // @ts-expect-error <StrictNullChecks/>
          customError={errors.requirementType}
        />
        {isRemoveable && (
          <CWIconButton
            iconName="close"
            onClick={onRemove}
            className="ml-auto cursor-pointer"
          />
        )}
      </div>

      {requirementType && (
        <div
          className={getClasses<{
            'cols-3'?: boolean;
            'cols-4'?: boolean;
            'cols-5'?: boolean;
            'row-1': boolean;
            'row-2': boolean;
          }>({
            'cols-3': isTokenRequirement && !isSuiTokenRequirement,
            'cols-4':
              (!isTokenRequirement && !is1155Requirement) ||
              isSuiTokenRequirement,
            'cols-5': !isTokenRequirement && is1155Requirement,
            'row-1': !isTokenRequirement && is1155Requirement,
            'row-2': !(!isTokenRequirement && is1155Requirement),
          })}
        >
          <CWSelectList
            key={defaultValues?.requirementChain?.value}
            name="requirementChain"
            label="Chain"
            placeholder="Chain"
            {...(defaultValues.requirementChain && {
              defaultValue: [defaultValues.requirementChain],
            })}
            options={chainTypes
              ?.filter(
                (x) =>
                  x.chainBase ===
                  (isCosmosRequirement
                    ? 'cosmos'
                    : isSPLRequirement
                      ? 'solana'
                      : isSuiRequirement || isSuiTokenRequirement
                        ? 'sui'
                        : 'ethereum'),
              )
              ?.map((chainType) => ({
                label: chainType.label,
                value: `${chainType.value}`,
              }))}
            onChange={(newValue) => {
              onChange({
                // @ts-expect-error <StrictNullChecks/>
                requirementChain: newValue.value,
              });
            }}
            // @ts-expect-error <StrictNullChecks/>
            customError={errors.requirementChain}
          />
          {!isTokenRequirement && !isSuiTokenRequirement && (
            <CWTextInput
              key={defaultValues.requirementContractAddress}
              name="requirementContractAddress"
              label="Contract Address"
              placeholder="Input contract address"
              containerClassName="w-full"
              fullWidth
              manualStatusMessage=""
              {...(defaultValues.requirementContractAddress && {
                defaultValue: defaultValues.requirementContractAddress,
              })}
              onInput={(e) => {
                onChange({
                  requirementContractAddress: (e.target as any).value,
                });
              }}
              // @ts-expect-error <StrictNullChecks/>
              customError={errors.requirementContractAddress}
            />
          )}
          {isSuiTokenRequirement && (
            <CWTextInput
              key={defaultValues.requirementCoinType}
              name="requirementCoinType"
              label="Coin Type"
              placeholder="e.g. 0x2::sui::SUI"
              containerClassName="w-full"
              fullWidth
              manualStatusMessage=""
              {...(defaultValues.requirementCoinType && {
                defaultValue: defaultValues.requirementCoinType,
              })}
              onInput={(e) => {
                onChange({
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  requirementCoinType: (e.target as any).value,
                });
              }}
              // @ts-expect-error <StrictNullChecks/>
              customError={errors.requirementCoinType}
            />
          )}
          <CWSelectList
            key={defaultValues?.requirementCondition?.value}
            name="requirementCondition"
            label="Condition"
            placeholder="Condition"
            {...(defaultValues.requirementCondition && {
              defaultValue: [defaultValues.requirementCondition],
            })}
            options={conditionTypes.map((conditionType) => ({
              label: conditionType.label,
              value: conditionType.value,
            }))}
            onChange={(newValue) => {
              onChange({
                // @ts-expect-error <StrictNullChecks/>
                requirementCondition: newValue.value,
              });
            }}
            // @ts-expect-error <StrictNullChecks/>
            customError={errors.requirementCondition}
            // ---
            // ATM the API only supports the "More" option, we make this field disabled with "More" as the
            // only selected option
            isDisabled
            // ---
          />
          <CWTextInput
            key={defaultValues.requirementAmount}
            name="requirementAmount"
            alignLabelToRight
            label="Amount"
            instructionalMessage={helperTextForAmount[requirementType]}
            placeholder="Enter an integer"
            {...(defaultValues.requirementAmount && {
              defaultValue: defaultValues.requirementAmount,
            })}
            onInput={(e) => {
              onChange({
                requirementAmount: (e.target as any).value,
              });
            }}
            // @ts-expect-error <StrictNullChecks/>
            customError={errors.requirementAmount}
            fullWidth
          />
          {is1155Requirement && (
            <CWTextInput
              key={defaultValues.requirementTokenId}
              name="requirementTokenId"
              label="ID"
              placeholder="ID"
              {...(defaultValues.requirementTokenId && {
                defaultValue: defaultValues.requirementTokenId,
              })}
              onInput={(e) => {
                onChange({
                  requirementTokenId: (e.target as any).value,
                });
              }}
              // @ts-expect-error <StrictNullChecks/>
              customError={errors.requirementTokenId}
              fullWidth
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RequirementSubForm;
