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
  SUI_NFT_SPECIFICATION,
  TOKENS,
  TRUST_LEVEL_SPECIFICATION,
  chainTypes,
  conditionTypes,
  requirementTypes,
} from '../../../../common/constants';
import { RequirementSubFormType } from '../index.types';
import './RequirementSubForm.scss';
import { GroupTrustLevelOptions } from './helpers';

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
  const isTrustLevelRequirement = requirementType === TRUST_LEVEL_SPECIFICATION;
  const isSuiRequirement = requirementType === TOKENS.SUI_TOKEN;
  const isSuiTokenRequirement = requirementType === TOKENS.SUI_TOKEN_TYPE;
  const isSuiNftRequirement = requirementType === SUI_NFT_SPECIFICATION;
  const helperTextForAmount = {
    [TOKENS.EVM_TOKEN]: 'Using 18 decimal precision',
    [TOKENS.COSMOS_TOKEN]: 'Using 6 decimal precision',
    [TOKENS.SUI_TOKEN]: 'Using 9 decimal precision',
    [TOKENS.SUI_TOKEN_TYPE]: 'Using 9 decimal precision',
    [SPL_SPECIFICATION]: 'Using 6 decimal precision',
    [SOL_NFT_SPECIFICATION]: 'Using 6 decimal precision',
    [SUI_NFT_SPECIFICATION]: 'Using 9 decimal precision',
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

  const getRequirementTypes = (chainBase: ChainBase) => {
    let allowedValues: string[] = [];
    switch (chainBase) {
      case ChainBase.CosmosSDK:
        allowedValues = [
          TOKENS.COSMOS_TOKEN,
          ...Object.values(CW_SPECIFICATIONS),
        ];
        break;

      case ChainBase.Solana:
        allowedValues = [SPL_SPECIFICATION, SOL_NFT_SPECIFICATION];
        break;

      case ChainBase.Sui:
        allowedValues = [
          TOKENS.SUI_TOKEN,
          TOKENS.SUI_TOKEN_TYPE,
          SUI_NFT_SPECIFICATION,
        ];
        break;

      default:
        allowedValues = [
          TOKENS.EVM_TOKEN,
          ...Object.values(ERC_SPECIFICATIONS),
        ];
        break;
    }

    return requirementTypes
      .filter(
        (x) =>
          allowedValues.includes(x.value) ||
          x.value === TRUST_LEVEL_SPECIFICATION,
      )
      .map((requirement) => ({
        label: requirement.label,
        value: requirement.value,
      }));
  };

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
          options={getRequirementTypes(app.chain.base)}
          onChange={(newValue) => {
            // @ts-expect-error <StrictNullChecks/>
            setRequirementType(newValue.value);

            onChange({
              // @ts-expect-error <StrictNullChecks/>
              requirementType: newValue.value,
            });
          }}
          className="w-350"
          customError={errors?.requirementType || ''}
        />
        {isRemoveable && (
          <CWIconButton
            iconName="close"
            onClick={onRemove}
            className="ml-auto cursor-pointer"
          />
        )}
      </div>

      {requirementType &&
        (!isTrustLevelRequirement ? (
          <div
            key={defaultValues?.requirementType?.value}
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
                isSuiTokenRequirement ||
                isSuiNftRequirement,
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
                        : isSuiRequirement ||
                            isSuiTokenRequirement ||
                            isSuiNftRequirement
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
              customError={errors?.requirementChain || ''}
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
                    requirementContractAddress: e.target.value,
                  });
                }}
                customError={errors?.requirementContractAddress || ''}
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
                    requirementCoinType: e.target.value,
                  });
                }}
                customError={errors?.requirementCoinType || ''}
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
              customError={errors?.requirementCondition || ''}
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
                  requirementAmount: e.target.value,
                });
              }}
              customError={errors?.requirementAmount || ''}
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
                    requirementTokenId: e.target.value,
                  });
                }}
                customError={errors?.requirementTokenId || ''}
                fullWidth
              />
            )}
            {isSuiNftRequirement && (
              <CWTextInput
                key={defaultValues.requirementContractAddress}
                name="requirementContractAddress"
                label="Collection ID"
                placeholder="e.g. 0x123...::nft_collection::NFT"
                containerClassName="w-full"
                fullWidth
                manualStatusMessage=""
                {...(defaultValues.requirementContractAddress && {
                  defaultValue: defaultValues.requirementContractAddress,
                })}
                onInput={(e) => {
                  onChange({
                    requirementContractAddress: e.target.value,
                  });
                }}
                customError={errors?.requirementContractAddress || ''}
              />
            )}
          </div>
        ) : (
          <div className="rows-1" key={defaultValues?.requirementType?.value}>
            <CWSelectList
              key={defaultValues?.requirementTrustLevel?.value}
              name="requirementTrustLevel"
              label="Trust level"
              placeholder="Trust level"
              {...(defaultValues.requirementTrustLevel && {
                defaultValue: [defaultValues.requirementTrustLevel],
              })}
              options={GroupTrustLevelOptions.map((x) => ({
                label: x.label,
                value: x.value.toString(),
              }))}
              onChange={(newValue) => {
                onChange({
                  // @ts-expect-error <StrictNullChecks/>
                  requirementTrustLevel: newValue.value,
                });
              }}
              customError={errors?.requirementTrustLevel}
            />
          </div>
        ))}
    </div>
  );
};

export default RequirementSubForm;
