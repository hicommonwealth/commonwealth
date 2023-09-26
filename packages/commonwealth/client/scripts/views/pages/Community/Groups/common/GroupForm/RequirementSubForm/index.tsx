import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { RequirementSubFormType } from '../index.types';
import './index.scss';

// TODO: these types are not complete, get complete list
const sampleRequirementTypes = [
  'Requirement type',
  'Cosmos base tokens',
  'ERC-20',
  'ERC-721',
];
const sampleChainTypes = ['Chain', 'Ethereum', 'Cosmos'];
const conditionTypes = ['Condition', 'More than', 'Equal to', 'Less than'];

const RequirementSubForm = ({
  errors,
  defaultValues = {},
  onRemove = () => null,
  onChange = () => null,
}: RequirementSubFormType) => {
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
          options={sampleRequirementTypes.map((requirement) => ({
            label: requirement,
            value: requirement,
          }))}
          onChange={(newValue) => {
            onChange({
              requirementType: newValue.value,
            });
          }}
          customError={errors.requirementType}
        />
        <CWIconButton iconName="close" onClick={onRemove} className="ml-auto" />
      </div>

      <div className="row-2">
        <CWSelectList
          key={defaultValues?.requirementChain?.value}
          name="requirementChain"
          label="Chain"
          placeholder="Chain"
          {...(defaultValues.requirementChain && {
            defaultValue: [defaultValues.requirementChain],
          })}
          options={sampleChainTypes.map((chainType) => ({
            label: chainType,
            value: chainType,
          }))}
          onChange={(newValue) => {
            onChange({
              requirementChain: newValue.value,
            });
          }}
          customError={errors.requirementChain}
        />
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
          customError={errors.requirementContractAddress}
        />
        <CWSelectList
          key={defaultValues?.requirementCondition?.value}
          name="requirementCondition"
          label="Condition"
          {...(defaultValues.requirementCondition && {
            defaultValue: [defaultValues.requirementCondition],
          })}
          options={conditionTypes.map((conditionType) => ({
            label: conditionType,
            value: conditionType,
          }))}
          onChange={(newValue) => {
            onChange({
              requirementCondition: newValue.value,
            });
          }}
          customError={errors.requirementCondition}
        />
        <CWTextInput
          key={defaultValues.requirementAmount}
          name="requirementAmount"
          label="Amount"
          placeholder="Amount"
          {...(defaultValues.requirementAmount && {
            defaultValue: defaultValues.requirementAmount,
          })}
          onInput={(e) => {
            onChange({
              requirementAmount: (e.target as any).value,
            });
          }}
          customError={errors.requirementAmount}
        />
      </div>
    </div>
  );
};

export default RequirementSubForm;
