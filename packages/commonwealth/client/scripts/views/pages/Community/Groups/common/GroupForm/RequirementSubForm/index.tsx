import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './index.scss';
import { RequirementSubFormType } from '../index.types';

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
  onRemove = () => null,
  onChange = () => null,
}: RequirementSubFormType) => {
  return (
    <div className="RequirementSubForm">
      <div className="row-1">
        <CWSelectList
          name="requirementType"
          label="Requirement type"
          placeholder="Requirement type"
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
          name="requirementChain"
          label="Chain"
          placeholder="Chain"
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
          name="requirementContractAddress"
          label="Contract Address"
          placeholder="Input contract address"
          containerClassName="w-full"
          fullWidth
          manualStatusMessage=""
          onInput={(e) => {
            onChange({
              requirementContractAddress: (e.target as any).value,
            });
          }}
          customError={errors.requirementContractAddress}
        />
        <CWSelectList
          name="requirementCondition"
          label="Condition"
          defaultValue={[
            { label: conditionTypes[0], value: conditionTypes[0] },
          ]}
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
          name="requirementAmount"
          label="Amount"
          placeholder="Amount"
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
