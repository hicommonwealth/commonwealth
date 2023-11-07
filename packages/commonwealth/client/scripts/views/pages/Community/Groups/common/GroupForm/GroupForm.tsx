/* eslint-disable react/no-multi-comp */
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { ZodError, ZodObject } from 'zod';
import {
  AMOUNT_CONDITIONS,
  TOKENS,
  conditionTypes,
} from '../../../common/constants';
import TopicGatingHelpMessage from '../../TopicGatingHelpMessage';
import './GroupForm.scss';
import RequirementSubForm from './RequirementSubForm';
import {
  CWRequirementsLabelInputFieldState,
  FormSubmitValues,
  GroupFormProps,
  RequirementSubFormsState,
  RequirementSubType,
} from './index.types';
import {
  VALIDATION_MESSAGES,
  groupValidationSchema,
  requirementSubFormValidationSchema,
} from './validations';

const REQUIREMENTS_TO_FULFILL = {
  ALL_REQUIREMENTS: 'ALL',
  N_REQUIREMENTS: 'N',
};

type CWRequirementsRadioButtonProps = {
  inputError?: string;
  inputValue: string;
  onInputValueChange: (value: string) => any;
};

const CWRequirementsRadioButton = ({
  inputError,
  inputValue,
  onInputValueChange,
}: CWRequirementsRadioButtonProps) => {
  const Label = (
    <span className="requirements-radio-btn-label">
      At least{' '}
      {
        <CWTextInput
          containerClassName={getClasses<{ failure?: boolean }>(
            { failure: !!inputError },
            'input',
          )}
          value={inputValue}
          onInput={(e) => onInputValueChange(e.target?.value?.trim())}
        />
      }{' '}
      # of all requirements
    </span>
  );

  return (
    <CWRadioButton
      label={Label}
      value={REQUIREMENTS_TO_FULFILL.N_REQUIREMENTS}
      name="requirementsToFulfill"
      hookToForm
    />
  );
};

const MAX_REQUIREMENTS = 10;

const getRequirementSubFormSchema = (
  requirementType: string,
): ZodObject<any> => {
  const isTokenRequirement = Object.values(TOKENS).includes(requirementType);
  const schema = isTokenRequirement
    ? requirementSubFormValidationSchema.omit({
        requirementContractAddress: true,
      })
    : requirementSubFormValidationSchema;
  return schema;
};

const GroupForm = ({
  formType,
  onSubmit,
  initialValues = {},
  onDelete = () => {},
}: GroupFormProps) => {
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
  });

  const takenGroupNames = groups.map(({ name }) => name.toLowerCase());

  const [isNameTaken, setIsNameTaken] = useState(false);

  const sortedTopics = (topics || []).sort((a, b) => a?.name?.localeCompare(b));
  const [cwRequiremenetsLabelInputField, setCwRequiremenetsLabelInputField] =
    useState<CWRequirementsLabelInputFieldState>({ value: '1', error: '' });
  const [requirementSubForms, setRequirementSubForms] = useState<
    RequirementSubFormsState[]
  >([
    {
      defaultValues: {
        requirementCondition: conditionTypes.find(
          (x) => x.value === AMOUNT_CONDITIONS.MORE,
        ),
      },
      values: {
        requirementAmount: '',
        requirementChain: '',
        requirementCondition: AMOUNT_CONDITIONS.MORE,
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
          defaultValues: {
            ...x,
            requirementCondition: conditionTypes.find(
              (y) => y.value === AMOUNT_CONDITIONS.MORE,
            ),
          },
          values: {
            requirementAmount: x?.requirementAmount || '',
            requirementChain: x?.requirementChain?.value || '',
            requirementCondition: AMOUNT_CONDITIONS.MORE,
            requirementContractAddress: x?.requirementContractAddress || '',
            requirementType: x?.requirementType?.value || '',
          },
          errors: {},
        })),
      );
    }

    if (
      initialValues.requirementsToFulfill &&
      initialValues.requirementsToFulfill !==
        REQUIREMENTS_TO_FULFILL.ALL_REQUIREMENTS
    ) {
      setCwRequiremenetsLabelInputField({
        ...cwRequiremenetsLabelInputField,
        value: `${initialValues.requirementsToFulfill}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeRequirementByIndex = (index: number) => {
    const updatedSubForms = [...requirementSubForms];
    updatedSubForms.splice(index, 1);
    setRequirementSubForms([...updatedSubForms]);
  };

  const addRequirementSubForm = () => {
    setRequirementSubForms([
      ...requirementSubForms,
      {
        defaultValues: {
          requirementCondition: conditionTypes.find(
            (x) => x.value === AMOUNT_CONDITIONS.MORE,
          ),
        },
        values: {
          requirementAmount: '',
          requirementChain: '',
          requirementCondition: AMOUNT_CONDITIONS.MORE,
          requirementContractAddress: '',
          requirementType: '',
        },
        errors: {},
      },
    ]);
  };

  const validateChangedValue = (
    val: Partial<RequirementSubType>,
    index: number,
  ) => {
    const allRequirements = [...requirementSubForms];

    // HACK ALERT: this type of validation change should be done internally by zod, by we are doing this
    // manually using javascript
    const isTokenRequirementTypeAdded =
      !Object.values(TOKENS).includes(
        allRequirements[index].values.requirementType,
      ) &&
      val.requirementType &&
      Object.values(TOKENS).includes(val.requirementType);
    if (isTokenRequirementTypeAdded) {
      allRequirements[index].errors.requirementContractAddress = '';
    }

    allRequirements[index] = {
      ...allRequirements[index],
      values: {
        ...allRequirements[index].values,
        ...val,
      },
    };
    const key = Object.keys(val)[0];
    try {
      // HACK ALERT: this type of validation change should be done internally by zod,
      // but we are doing this manually using javascript
      const schema = getRequirementSubFormSchema(
        allRequirements[index].values.requirementType,
      );
      schema.pick({ [key]: true }).parse(val);

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
        // HACK ALERT: this type of validation change should be done internally by zod, by we are doing this
        // manually using javascript
        const schema = getRequirementSubFormSchema(
          subForm.values.requirementType,
        );
        if (subForm.values.requirementType === '') {
          schema.pick({ requirementType: true }).parse(subForm.values);
        } else {
          schema.parse(subForm.values);
        }

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

  const handleSubmit = async (values: FormSubmitValues) => {
    const hasSubFormErrors = validateSubForms();
    if (hasSubFormErrors || cwRequiremenetsLabelInputField.error) {
      return;
    }

    // Custom validation for the radio with input label
    let requirementsToFulfill: any = values.requirementsToFulfill;
    setCwRequiremenetsLabelInputField({
      ...cwRequiremenetsLabelInputField,
      error: '',
    });
    if (
      values.requirementsToFulfill === REQUIREMENTS_TO_FULFILL.N_REQUIREMENTS
    ) {
      // If radio label input has no value
      if (!cwRequiremenetsLabelInputField.value) {
        setCwRequiremenetsLabelInputField({
          ...cwRequiremenetsLabelInputField,
          error: VALIDATION_MESSAGES.NO_INPUT,
        });
        return;
      }

      // If radio label input has invalid value
      requirementsToFulfill = parseInt(
        cwRequiremenetsLabelInputField.value || '',
      );
      if (
        !requirementsToFulfill ||
        requirementsToFulfill < 1 ||
        requirementsToFulfill > MAX_REQUIREMENTS ||
        /[^0-9]/g.test(cwRequiremenetsLabelInputField.value)
      ) {
        setCwRequiremenetsLabelInputField({
          ...cwRequiremenetsLabelInputField,
          error: VALIDATION_MESSAGES.INVALID_VALUE,
        });
        return;
      }
    }

    const formValues = {
      ...values,
      requirementsToFulfill,
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
        requirementsToFulfill: initialValues.requirementsToFulfill
          ? initialValues.requirementsToFulfill ===
            REQUIREMENTS_TO_FULFILL.ALL_REQUIREMENTS
            ? REQUIREMENTS_TO_FULFILL.ALL_REQUIREMENTS
            : REQUIREMENTS_TO_FULFILL.N_REQUIREMENTS
          : '',
        topics: initialValues.topics || '',
      }}
      validationSchema={groupValidationSchema}
      onSubmit={handleSubmit}
      onErrors={validateSubForms}
    >
      {({ formState }) => (
        <>
          {/* TODO: add breadcrum here as a separate div when that ticket is done */}

          {/* Form header */}
          <div className="header-row">
            <CWText type="h2" fontWeight="semiBold" className="header-text">
              {formType === 'create' ? 'Create a group' : 'Edit group'}
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
              instructionalMessage="Can be up to 40 characters long"
              customError={isNameTaken ? 'Group name is already taken' : ''}
              onInput={(e) => {
                setIsNameTaken(
                  takenGroupNames.includes(e.target.value.toLowerCase()),
                );
              }}
            />
            <CWTextArea
              name="groupDescription"
              hookToForm
              label="Description"
              placeholder="Add a description for your group"
              instructionalMessage="Can be up to 250 characters long"
            />
          </section>

          <CWDivider />

          {/* Requirements section */}
          <section className="form-section">
            <div className="header-row">
              <CWText type="h3" fontWeight="semiBold" className="header-text">
                Requirements
              </CWText>
              <CWText type="b2">
                Add requirements for access to gated topics
              </CWText>
            </div>

            {/* Sub-section: Necessary requirements */}
            <section className="form-section">
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
              <CWButton
                disabled={requirementSubForms.length === MAX_REQUIREMENTS}
                type="button"
                label={
                  requirementSubForms.length === MAX_REQUIREMENTS
                    ? 'Cannot add more than 10 requirements'
                    : 'Add requirement'
                }
                iconLeft={
                  requirementSubForms.length === MAX_REQUIREMENTS
                    ? null
                    : 'plus'
                }
                buttonWidth="full"
                buttonType="secondary"
                buttonHeight="med"
                onClick={addRequirementSubForm}
              />

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
                  value={REQUIREMENTS_TO_FULFILL.ALL_REQUIREMENTS}
                  name="requirementsToFulfill"
                  hookToForm
                />

                <CWRequirementsRadioButton
                  inputError={cwRequiremenetsLabelInputField.error}
                  inputValue={cwRequiremenetsLabelInputField.value}
                  onInputValueChange={(value) =>
                    setCwRequiremenetsLabelInputField({
                      value,
                      error: '',
                    })
                  }
                />

                {(formState?.errors?.requirementsToFulfill?.message ||
                  cwRequiremenetsLabelInputField.error) && (
                  <MessageRow
                    hasFeedback
                    statusMessage={
                      formState?.errors?.requirementsToFulfill?.message ||
                      cwRequiremenetsLabelInputField.error
                    }
                    validationStatus="failure"
                  />
                )}
              </div>
            </section>

            {/* Sub-section: Gated topics */}
            <section className="form-section">
              <div className="header-row">
                <CWText type="h4" fontWeight="semiBold" className="header-text">
                  Gated topic(s)
                </CWText>
                <CWText type="b2">
                  Add topics to gate to auto-lock it for group members who
                  satisfy the requirements above
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

          {formType === 'create' && <TopicGatingHelpMessage />}

          {/* Form action buttons */}
          <div className="action-buttons">
            {formType === 'edit' ? (
              <CWButton
                label="Delete group"
                buttonWidth="narrow"
                buttonType="destructive"
                type="button"
                onClick={onDelete}
              />
            ) : (
              <CWButton
                label="Back"
                buttonWidth="wide"
                buttonType="secondary"
                type="button"
                onClick={() => navigate('/members?tab=groups')}
              />
            )}

            {formType === 'edit' && (
              <CWButton
                containerClassName="ml-auto"
                label="Cancel"
                buttonWidth="narrow"
                buttonType="secondary"
                type="button"
                onClick={() => navigate('/members?tab=groups')}
              />
            )}

            <CWButton
              type="submit"
              buttonWidth="wide"
              disabled={isNameTaken}
              label={formType === 'create' ? 'Create group' : 'Save changes'}
            />
          </div>
        </>
      )}
    </CWForm>
  );
};

export default GroupForm;
