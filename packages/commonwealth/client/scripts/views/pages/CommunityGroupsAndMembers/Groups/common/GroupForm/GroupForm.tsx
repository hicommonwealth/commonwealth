/* eslint-disable react/no-multi-comp */
import { weightedVotingValueToLabel } from 'helpers';
import { isValidEthAddress } from 'helpers/validateTypes';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { ZodError, ZodObject } from 'zod';
import {
  AMOUNT_CONDITIONS,
  ERC_SPECIFICATIONS,
  TOKENS,
  conditionTypes,
} from '../../../common/constants';
import Allowlist from './Allowlist';
import './GroupForm.scss';
import RequirementSubForm from './RequirementSubForm';
import TopicPermissionsSubForm from './TopicPermissionsSubForm';
import {
  REQUIREMENTS_TO_FULFILL,
  REVERSED_TOPIC_PERMISSIONS,
  TOPIC_PERMISSIONS,
} from './constants';
import { convertAccumulatedPermissionsToGranularPermissions } from './helpers';
import {
  FormSubmitValues,
  GroupFormProps,
  RequirementSubFormsState,
  RequirementSubType,
  TopicPermissions,
  TopicPermissionsSubFormsState,
} from './index.types';
import {
  VALIDATION_MESSAGES,
  groupValidationSchema,
  requirementSubFormValidationSchema,
} from './validations';

type CWRequirementsRadioButtonProps = {
  maxRequirements: number;
  inputValue: string;
  isSelected: boolean;
  onSelect: () => any;
  onInputValueChange: (value: string) => any;
};

const CWRequirementsRadioButton = ({
  maxRequirements = 1,
  inputValue,
  isSelected,
  onSelect,
  onInputValueChange,
}: CWRequirementsRadioButtonProps) => {
  const options = useMemo(
    () =>
      Array.from({ length: maxRequirements }).map((_, index) => ({
        label: `${index + 1}`,
        value: `${index + 1}`,
      })),
    [maxRequirements],
  );

  const value = useMemo(() => {
    if (inputValue) {
      return {
        label: inputValue,
        value: inputValue,
      };
    }

    return options[0];
  }, [inputValue, options]);

  const Label = (
    <span className="requirements-radio-btn-label">
      Minimum number of conditions to join{' '}
      <CWSelectList
        isDisabled={!isSelected}
        isSearchable={false}
        isClearable={false}
        options={options}
        value={value}
        onChange={(selectedOption) => {
          // @ts-expect-error <StrictNullChecks/>
          onInputValueChange(`${selectedOption.value}`);
        }}
      />
    </span>
  );

  return (
    <>
      <CWRadioButton
        label={Label}
        value={REQUIREMENTS_TO_FULFILL.N_REQUIREMENTS}
        name="requirementsToFulfill"
        hookToForm
        onChange={(e) => {
          if (e.target.checked) {
            onSelect();
          }
        }}
      />
    </>
  );
};

const MAX_REQUIREMENTS = 10;

const getRequirementSubFormSchema = (
  requirementType: string,
): ZodObject<any> => {
  const isTokenRequirement = Object.values(TOKENS).includes(requirementType);
  const is1155Requirement = requirementType === ERC_SPECIFICATIONS.ERC_1155;

  const schema = isTokenRequirement
    ? requirementSubFormValidationSchema.omit({
        requirementContractAddress: true,
        requirementTokenId: true,
      })
    : !is1155Requirement
      ? requirementSubFormValidationSchema.omit({
          requirementTokenId: true,
        })
      : requirementSubFormValidationSchema;
  return schema;
};

const GroupForm = ({
  formType,
  onSubmit,
  initialValues = {},
  onDelete = () => {},
  allowedAddresses,
  setAllowedAddresses,
}: GroupFormProps) => {
  const communityId = app.activeChainId() || '';
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId,
    enabled: !!communityId,
  });

  const takenGroupNames = groups.map(({ name }) => name.toLowerCase());
  const sortedTopics = (topics || []).sort((a, b) =>
    a?.name?.localeCompare(b.name),
  );

  const [isNameTaken, setIsNameTaken] = useState(false);
  const [
    isSelectedCustomRequirementsToFulfillOption,
    setIsSelectedCustomRequirementsToFulfillOption,
  ] = useState(
    initialValues?.requirementsToFulfill &&
      initialValues?.requirementsToFulfill !== 'ALL',
  );
  const [cwRequiremenetsLabelInputValue, setCwRequiremenetsLabelInputValue] =
    useState('1');
  const [requirementSubForms, setRequirementSubForms] = useState<
    RequirementSubFormsState[]
  >([]);
  const [topicPermissionsSubForms, setTopicPermissionsSubForms] = useState<
    TopicPermissionsSubFormsState[]
  >([]);

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
            requirementTokenId: x?.requirementTokenId || '',
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
      setCwRequiremenetsLabelInputValue(
        `${initialValues.requirementsToFulfill}`,
      );
    }

    if (initialValues.topics) {
      setTopicPermissionsSubForms(
        initialValues.topics.map((t) => ({
          permission: t.permission,
          topic: { id: parseInt(`${t.value}`), name: t.label },
        })),
      );
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
          requirementTokenId: '',
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
        // @ts-expect-error <StrictNullChecks/>
        allRequirements[index].values.requirementType,
      ) &&
      val.requirementType &&
      Object.values(TOKENS).includes(val.requirementType);
    if (isTokenRequirementTypeAdded) {
      // @ts-expect-error <StrictNullChecks/>
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
        // @ts-expect-error <StrictNullChecks/>
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

    // Validate if contract address is valid based on the selected requirement type
    if (val.requirementContractAddress) {
      const isInvalidEthAddress =
        [...Object.values(ERC_SPECIFICATIONS), TOKENS.EVM_TOKEN].includes(
          // @ts-expect-error <StrictNullChecks/>
          allRequirements[index].values.requirementType,
        ) && !isValidEthAddress(val.requirementContractAddress);

      if (isInvalidEthAddress) {
        allRequirements[index] = {
          ...allRequirements[index],
          errors: {
            ...allRequirements[index].errors,
            [key]: VALIDATION_MESSAGES.INVALID_INPUT,
          },
        };
      }
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
          // @ts-expect-error <StrictNullChecks/>
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

    // @ts-expect-error <StrictNullChecks/>
    return !!updatedSubForms.find((x) => Object.keys(x.errors).length > 0);
  };

  const handleSubmit = async (values: FormSubmitValues) => {
    const hasSubFormErrors = validateSubForms();
    if (hasSubFormErrors) {
      return;
    }

    // Custom validation for the radio with input label
    let requirementsToFulfill: any = values.requirementsToFulfill;
    setCwRequiremenetsLabelInputValue(cwRequiremenetsLabelInputValue);
    if (
      values.requirementsToFulfill === REQUIREMENTS_TO_FULFILL.N_REQUIREMENTS
    ) {
      requirementsToFulfill = parseInt(cwRequiremenetsLabelInputValue);
    }

    const formValues = {
      ...values,
      topics: topicPermissionsSubForms.map((t) => ({
        id: t.topic.id,
        permissions: convertAccumulatedPermissionsToGranularPermissions(
          REVERSED_TOPIC_PERMISSIONS[t.permission],
        ),
      })),
      requirementsToFulfill,
      requirements: requirementSubForms.map((x) => x.values),
    };

    await onSubmit(formValues);
  };

  const handleWatchForm = (values: FormSubmitValues) => {
    if (values?.topics?.length > 0) {
      setTopicPermissionsSubForms(
        values.topics.map((topic) => ({
          topic: {
            id: parseInt(`${topic.value}`),
            name: topic.label,
          },
          permission: TOPIC_PERMISSIONS.UPVOTE_AND_COMMENT_AND_POST,
        })),
      );
    } else {
      setTopicPermissionsSubForms([]);
    }
  };

  const updateTopicPermissionByIndex = (
    index: number,
    newPermission: TopicPermissions,
  ) => {
    const updatedTopicPermissionsSubForms = [...topicPermissionsSubForms];
    updatedTopicPermissionsSubForms[index].permission = newPermission;
    setTopicPermissionsSubForms([...updatedTopicPermissionsSubForms]);
  };

  // + 1 for allowlists
  const maxRequirements = requirementSubForms.length + 1;

  return (
    <CWPageLayout>
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
          topics:
            initialValues?.topics?.map((t) => ({
              label: t.label,
              value: t.value,
            })) || '',
        }}
        validationSchema={groupValidationSchema}
        onSubmit={handleSubmit}
        onErrors={validateSubForms}
        onWatch={handleWatchForm}
      >
        {({ formState }) => (
          <>
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
                label="Description (optional)"
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
                    // @ts-expect-error <StrictNullChecks/>
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
                  // @ts-expect-error <StrictNullChecks/>
                  iconLeft={
                    requirementSubForms.length === MAX_REQUIREMENTS
                      ? null
                      : 'plus'
                  }
                  buttonWidth="full"
                  buttonType="secondary"
                  buttonHeight="med"
                  onClick={(e) => {
                    (e?.target as HTMLButtonElement)?.blur();
                    addRequirementSubForm();
                  }}
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
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIsSelectedCustomRequirementsToFulfillOption(false);
                      }
                    }}
                  />

                  <CWRequirementsRadioButton
                    maxRequirements={maxRequirements}
                    inputValue={cwRequiremenetsLabelInputValue}
                    // @ts-expect-error <StrictNullChecks/>
                    isSelected={isSelectedCustomRequirementsToFulfillOption}
                    onSelect={() =>
                      setIsSelectedCustomRequirementsToFulfillOption(true)
                    }
                    onInputValueChange={(value) => {
                      setCwRequiremenetsLabelInputValue(value);
                    }}
                  />

                  {formState?.errors?.requirementsToFulfill?.message && (
                    <MessageRow
                      hasFeedback
                      statusMessage={
                        formState?.errors?.requirementsToFulfill?.message
                      }
                      validationStatus="failure"
                    />
                  )}
                </div>
              </section>

              {/* Sub-section: Gated topics */}
              <section className="form-section">
                <div className="header-row">
                  <CWText
                    type="h4"
                    fontWeight="semiBold"
                    className="header-text"
                  >
                    Gate topics
                  </CWText>
                  <CWText type="b2">
                    Add topics that only group members who satisfy the
                    requirements above can participate in.
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
                    helpText: weightedVotingValueToLabel(
                      topic.weighted_voting!,
                    ),
                  }))}
                />
              </section>

              {/* Sub-section: Gated topic permissions */}
              {topicPermissionsSubForms?.length > 0 && (
                <section className="form-section">
                  <div className="header-row">
                    <CWText
                      type="h4"
                      fontWeight="semiBold"
                      className="header-text"
                    >
                      Topic Permissions
                    </CWText>
                    <CWText type="b2">
                      Select which topics this group can create threads and
                      within.
                    </CWText>
                  </div>

                  <CWText type="b2" className="topic-permission-header">
                    Topic
                  </CWText>

                  {topicPermissionsSubForms.map((topicPermission, index) => (
                    <>
                      <CWDivider className="divider-spacing" />
                      <TopicPermissionsSubForm
                        key={topicPermission.topic.id}
                        topic={topicPermission.topic}
                        defaultPermission={topicPermission.permission}
                        onPermissionChange={(newPermission) =>
                          updateTopicPermissionByIndex(index, newPermission)
                        }
                      />
                      {index === topicPermissionsSubForms.length - 1 && (
                        <CWDivider className="divider-spacing" />
                      )}
                    </>
                  ))}
                </section>
              )}
            </section>

            <Allowlist
              allowedAddresses={allowedAddresses}
              setAllowedAddresses={setAllowedAddresses}
            />

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
                disabled={
                  isNameTaken ||
                  (requirementSubForms.length === 0 &&
                    allowedAddresses.length === 0)
                }
                label={formType === 'create' ? 'Create group' : 'Save changes'}
              />
            </div>
          </>
        )}
      </CWForm>
    </CWPageLayout>
  );
};

export default GroupForm;
