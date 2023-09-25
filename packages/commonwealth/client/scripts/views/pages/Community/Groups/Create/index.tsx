import React, { useState } from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import z, { ZodError } from 'zod';
import TopicGatingHelpMessage from '../TopicGatingHelpMessage';
import './index.scss';

// The first value in array is used as placeholder
const sampleRequirementTypes = [
  'Requirement type',
  'Cosmos base tokens',
  'ERC-20',
  'ERC-721',
  'EVM Base Tokens',
];
const smapleChainTypes = ['Chain', 'Ethereum', 'Cosmos']; // TODO: get full list
const conditionTypes = ['Condition', 'More than', 'Equal to', 'Less than'];
const sampleChainTopics = ['Call Updated', 'Change log', 'Communites'];

const CWRequirementsRadioButton = () => {
  const Label = (
    <span className="requirements-radio-btn-label">
      At least {<CWTextInput containerClassName="input" />} # of all
      requirements
    </span>
  );

  return <CWRadioButton label={Label} value="n-requirements" />;
};

const createGroupRequirementValidationSchema = z.object({
  requirementType: z.string().nonempty({ message: 'Type is required!' }),
  requirementChain: z.string().nonempty({ message: 'Chain is required!' }),
  requirementContractAddress: z
    .string()
    .nonempty({ message: 'Address is required!' })
    .min(10, { message: 'Address must be valid!' }),
  requirementCondition: z
    .string()
    .nonempty({ message: 'Condition is required!' }),
  requirementAmount: z
    .string()
    .nonempty({ message: 'Amount is required!' })
    .refine(
      (value) => {
        return !isNaN(Number(value));
      },
      { message: 'Amount must be a valid number!' }
    ),
});

type RequirementTypeObject = {
  requirementType?: string;
  requirementContractAddress?: string;
  requirementChain?: string;
  requirementCondition?: string;
  requirementAmount?: string;
};

type RequirementSubFormType = {
  errors?: any;
  onRemove: () => any;
  onChange: (values: RequirementTypeObject) => any;
};

const RequirementSubForm = ({
  errors,
  onRemove = () => null,
  onChange = () => null,
}: RequirementSubFormType) => {
  return (
    <div className="requirement-sub-form">
      <div className="requirement-sub-form-row-1">
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

      <div className="requirement-sub-form-row-2">
        <CWSelectList
          name="requirementChain"
          label="Chain"
          placeholder="Chain"
          options={smapleChainTypes.map((chainType) => ({
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

const createGroupValidationSchema = z.object({
  groupName: z
    .string()
    .nonempty({ message: 'Group name is required!' })
    .min(3, { message: 'Group name must have minimun 3 characters!' }),
  groupDescription: z
    .string()
    .max(500, {
      message: 'Group description must not be more than 500 characters!',
    }),
  topics: z
    .array(
      z.object({
        value: z.string().nonempty({ message: 'Invalid value' }),
        label: z.string().nonempty({ message: 'Invalid value' }),
      }),
      {
        invalid_type_error: 'Invalid value',
        required_error: 'Topic(s) are required',
      }
    )
    .min(1, { message: 'At least 1 topic is required' })
    .nonempty({ message: 'Topic(s) are required' }),
});

type RequirementSubFormObject = {
  requirementType?: string;
  requirementContractAddress?: string;
  requirementChain?: string;
  requirementCondition?: string;
  requirementAmount?: string;
};

const CreateCommunityGroupPage = () => {
  const [requirementSubForms, setRequirementSubForms] = useState<
    {
      values: RequirementTypeObject;
      errors?: RequirementSubFormObject;
    }[]
  >([
    {
      values: {
        requirementAmount: '',
        requirementChain: '',
        requirementCondition: '',
        requirementContractAddress: '',
        requirementType: '',
      },
      errors: {},
    },
  ]);

  const removeRequirementByIndex = (index: number) => {
    setRequirementSubForms(requirementSubForms.splice(index, 1));
  };

  const addRequirementSubForm = () => {
    setRequirementSubForms([
      ...requirementSubForms,
      {
        values: {
          requirementAmount: '',
          requirementChain: '',
          requirementCondition: '',
          requirementContractAddress: '',
          requirementType: '',
        },
        errors: {},
      },
    ]);
  };

  const validateChangedValue = (val, index) => {
    const allRequirements = [...requirementSubForms];
    allRequirements[index] = {
      ...allRequirements[index],
      values: {
        ...allRequirements[index].values,
        ...val,
      },
    };
    const key = Object.keys(val)[0];
    try {
      createGroupRequirementValidationSchema
        .pick({
          [key]: true,
        })
        .parse(val);
      allRequirements[index] = {
        ...allRequirements[index],
        errors: {
          ...allRequirements[index].errors,
          [key]: '',
        },
      };
    } catch (e: any) {
      const zodError = e as ZodError;
      const message = zodError.errors[0].message;

      allRequirements[index] = {
        ...allRequirements[index],
        errors: {
          ...allRequirements[index].errors,
          [key]: message,
        },
      };
    }

    setRequirementSubForms([...allRequirements]);
  };

  const validateSubForms = () => {
    const updatedSubForms = [...requirementSubForms];

    requirementSubForms.map((subForm, index) => {
      try {
        createGroupRequirementValidationSchema.parse(subForm.values);
        updatedSubForms[index] = {
          ...updatedSubForms[index],
          errors: {},
        };
      } catch (e: any) {
        const zodError = e as ZodError;
        const errors = {};
        zodError.errors.map((x) => {
          errors[x.path[0]] = x.message;
        });

        updatedSubForms[index] = {
          ...updatedSubForms[index],
          errors: errors as any,
        };
      }
    });

    setRequirementSubForms([...updatedSubForms]);

    return !!updatedSubForms.find((x) => Object.keys(x.errors).length > 0);
  };

  const handleSubmit = (values) => {
    const hasSubFormErrors = validateSubForms();
    if (hasSubFormErrors) {
      return;
    }

    const formValues = {
      ...values,
      requirements: requirementSubForms.map((x) => x.values),
    };
  };

  return (
    <CWForm
      className="CreateCommunityGroupPage"
      validationSchema={createGroupValidationSchema}
      onSubmit={handleSubmit}
      onErrors={validateSubForms}
    >
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
        <CWTextInput
          name="groupName"
          hookToForm
          label="Group name"
          placeholder="Group name"
          fullWidth
        />
        <CWTextArea
          name="groupDescription"
          hookToForm
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
              groupName="numberOfRequirements"
              label="All requirements must be satisfied"
              value="all-requirements"
            />

            <CWRequirementsRadioButton />
          </div>

          {/* Added Requirements */}
          {requirementSubForms.map((subForm, index) => (
            <RequirementSubForm
              key={index}
              errors={subForm.errors}
              onChange={(val) => validateChangedValue(val, index)}
              onRemove={() => removeRequirementByIndex(index)}
            />
          ))}

          <CWButton
            type="button"
            label="Add requirement"
            iconLeft="plus"
            buttonWidth="full"
            buttonType="secondary"
            buttonHeight="med"
            onClick={addRequirementSubForm}
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

          <CWSelectList
            name="topics"
            hookToForm
            isMulti
            isClearable={false}
            label="Topics"
            placeholder="Type in topic name"
            options={sampleChainTopics.map((chainTopic) => ({
              label: chainTopic,
              value: chainTopic,
            }))}
          />
        </section>
      </section>

      <TopicGatingHelpMessage />

      {/* Form action buttons */}
      <div className="action-buttons">
        <CWButton
          label="Back"
          buttonWidth="wide"
          buttonType="secondary"
          type="button"
        />
        <CWButton label="Create group" buttonWidth="wide" type="submit" />
      </div>
    </CWForm>
  );
};

export default CreateCommunityGroupPage;
