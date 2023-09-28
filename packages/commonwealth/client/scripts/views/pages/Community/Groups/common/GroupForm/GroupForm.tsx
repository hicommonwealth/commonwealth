import React, { useEffect, useState } from 'react';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { ZodError } from 'zod';
import TopicGatingHelpMessage from '../../TopicGatingHelpMessage';
import './GroupForm.scss';
import RequirementSubForm from './RequirementSubForm';
import {
  GroupFormProps,
  RequirementSubType,
  RequirementSubTypeWithLabel,
} from './index.types';
import {
  groupValidationSchema,
  requirementSubFormValidationSchema,
} from './validations';

const CWRequirementsRadioButton = () => {
  const Label = (
    <span className="requirements-radio-btn-label">
      At least {<CWTextInput containerClassName="input" />} # of all
      requirements
    </span>
  );

  return <CWRadioButton label={Label} value="n-requirements" />;
};

const MAX_REQUIREMENTS = 10;

const GroupForm = ({
  formType,
  onSubmit,
  initialValues = {},
}: GroupFormProps) => {
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });
  const sortedTopics = (topics || []).sort((a, b) => a?.name?.localeCompare(b));

  const [requirementSubForms, setRequirementSubForms] = useState<
    {
      defaultValues?: RequirementSubTypeWithLabel;
      values: RequirementSubType;
      errors?: RequirementSubType;
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

  useEffect(() => {
    if (initialValues.requirements) {
      setRequirementSubForms(
        initialValues.requirements.map((x) => ({
          defaultValues: x,
          values: {
            requirementAmount: x?.requirementAmount || '',
            requirementChain: x?.requirementChain?.value || '',
            requirementCondition: x?.requirementCondition?.value || '',
            requirementContractAddress: x?.requirementContractAddress || '',
            requirementType: x?.requirementType?.value || '',
          },
          errors: {},
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      requirementSubFormValidationSchema
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
        requirementSubFormValidationSchema.parse(subForm.values);
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

  const handleSubmit = async (values) => {
    const hasSubFormErrors = validateSubForms();
    if (hasSubFormErrors) {
      return;
    }

    const formValues = {
      ...values,
      requirements: requirementSubForms.map((x) => x.values),
    };

    await onSubmit(formValues);
  };

  return (
    <CWForm
      className="GroupForm"
      initialValues={{
        groupName: initialValues.groupName || '',
        groupDescription: initialValues.groupDescription || '',
        topics: initialValues.topics || '',
      }}
      validationSchema={groupValidationSchema}
      onSubmit={handleSubmit}
      onErrors={validateSubForms}
    >
      {/* TODO: add breadcrum here as a separate div when that ticket is done */}

      {/* Form header */}
      <div className="header-row">
        <CWText type="h2" fontWeight="semiBold" className="header-text">
          {formType === 'create' ? 'Create a group' : 'Update your group'}
        </CWText>
        <CWText type="b2">
          {formType === 'create'
            ? 'Create attributes-based groups for gating topics within your community'
            : 'Update group attributes'}
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
              defaultValues={subForm.defaultValues}
              errors={subForm.errors}
              onChange={(val) => validateChangedValue(val, index)}
              isRemoveable={index > 0}
              onRemove={() => removeRequirementByIndex(index)}
            />
          ))}

          {requirementSubForms.length < MAX_REQUIREMENTS && (
            <CWButton
              type="button"
              label="Add requirement"
              iconLeft="plus"
              buttonWidth="full"
              buttonType="secondary"
              buttonHeight="med"
              onClick={addRequirementSubForm}
            />
          )}
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
            options={sortedTopics.map((topic) => ({
              label: topic.name,
              value: topic.id,
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
        <CWButton
          type="submit"
          buttonWidth="wide"
          label={formType === 'create' ? 'Create group' : 'Update group'}
        />
      </div>
    </CWForm>
  );
};

export default GroupForm;
