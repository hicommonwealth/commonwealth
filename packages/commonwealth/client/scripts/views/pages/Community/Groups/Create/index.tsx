import React, { useState } from 'react';
import { Select } from 'views/components/Select';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import TopicGatingHelpMessage from '../TopicGatingHelpMessage';
import './index.scss';

// The first value in array is used as placeholder
const requirementTypes = [
  'Requirement type',
  'Cosmos base tokens',
  'ERC-20',
  'ERC-721',
  'EVM Base Tokens',
];
const chainTypes = ['Chain', 'Ethereum', 'Cosmos']; // TODO: get full list
const conditionTypes = ['Condition', 'More than', 'Equal to', 'Less than'];

const CWRequirementsRadioButton = () => {
  const Label = (
    <span className="requirements-radio-btn-label">
      At least {<CWTextInput containerClassName="input" />} # of all
      requirements
    </span>
  );

  return <CWRadioButton label={Label} value="n-requirements" />;
};

const RequirementSubForm = ({ onRemove = () => null }) => {
  return (
    <div className="requirement-sub-form">
      <div className="requirement-sub-form-row">
        <Select
          label="Requirement type"
          selected={requirementTypes[0]}
          options={requirementTypes.map((requirement, index) => ({
            id: index,
            label: requirement,
            value: requirement,
          }))}
        />
        <CWIconButton iconName="close" onClick={onRemove} className="ml-auto" />
      </div>

      <div className="requirement-sub-form-row">
        <Select
          label="Chain"
          selected={chainTypes[0]}
          options={chainTypes.map((chainType, index) => ({
            id: index,
            label: chainType,
            value: chainType,
          }))}
        />
        <CWTextInput
          label="Contract Address"
          placeholder="Input contract address"
          containerClassName="w-full"
          fullWidth
        />
        <Select
          label="Condition"
          selected={conditionTypes[0]}
          options={conditionTypes.map((conditionType, index) => ({
            id: index,
            label: conditionType,
            value: conditionType,
          }))}
        />
        <CWTextInput label="Amount" placeholder="Amount" />
      </div>
    </div>
  );
};

const CreateCommunityGroupPage = () => {
  const [requirements, setRequirements] = useState([1]); // dummy state for now

  const removeRequirementByIndex = (index: number) => {
    setRequirements(requirements.splice(index, 1));
  };

  return (
    <div className="CreateCommunityGroupPage">
      {/* TODO: add breadcrum here as a separate div when that ticket is done */}

      {/* Form header */}
      <div className="header-row">
        <CWText type="h2" fontWeight="semiBold" className="header-text">
          Create a group
        </CWText>
        <CWText type="b2">
          Create attributes-based groups for gating topics within your community
        </CWText>
      </div>

      {/* Basic information section */}
      <section className="form-section">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          Basic information
        </CWText>
        <CWTextInput label="Group name" placeholder="Group name" fullWidth />
        <CWTextArea
          label="Description"
          placeholder="Add a description for your group"
        />
      </section>

      <CWDivider />

      {/* Requirements section */}
      <section className="form-section">
        <div className="header-row">
          <CWText type="h3" fontWeight="semiBold" className="header-text">
            Requirements
          </CWText>
          <CWText type="b2">Add requirements for access to gated topics</CWText>
        </div>

        {/* Sub-section: Necessary requirements */}
        <section className="form-section">
          <CWText
            type="h4"
            fontWeight="semiBold"
            className="header-row header-text"
          >
            Necessary requirements
          </CWText>

          <div className="radio-buttons">
            <CWRadioButton
              label="All requirements must be satisfied"
              value="all-requirements"
            />

            <CWRequirementsRadioButton />
          </div>

          {/* Added Requirements */}
          {requirements.map((r, index) => (
            <RequirementSubForm
              onRemove={() => removeRequirementByIndex(index)}
            />
          ))}

          <CWButton
            label="Add requirement"
            iconLeft="plus"
            buttonWidth="full"
            buttonType="secondary"
            buttonHeight="med"
            onClick={() => setRequirements([...requirements, 1])}
          />
        </section>

        {/* Sub-section: Gated topics */}
        <section className="form-section">
          <div className="header-row">
            <CWText type="h4" fontWeight="semiBold" className="header-text">
              Gated topic(s)
            </CWText>
            <CWText type="b2">
              Add topics to gate to auto-lock it for group members who satisfy
              the requirements above
            </CWText>
          </div>

          {/* TODO: this is a tag input */}
          <CWTextInput
            label="Topcis"
            placeholder="Type in topic name"
            fullWidth
          />
        </section>
      </section>

      <TopicGatingHelpMessage />

      {/* Form action buttons */}
      <div className="action-buttons">
        <CWButton label="Back" buttonWidth="wide" buttonType="secondary" />
        <CWButton label="Create group" buttonWidth="wide" />
      </div>
    </div>
  );
};

export default CreateCommunityGroupPage;
