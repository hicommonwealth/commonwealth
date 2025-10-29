/* eslint-disable react/no-multi-comp */
import { isGatedAction } from '@hicommonwealth/shared';
import {
  CWImageInput,
  ImageBehavior,
} from 'client/scripts/views/components/component_kit/CWImageInput';
import { weightedVotingValueToLabel } from 'helpers';
import { isValidEthAddress } from 'helpers/validateTypes';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MultiValueProps,
  OptionProps,
  SingleValueProps,
  components,
} from 'react-select';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
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
  SUI_NFT_SPECIFICATION,
  TOKENS,
  TRUST_LEVEL_SPECIFICATION,
  conditionTypes,
} from '../../../common/constants';
import Allowlist from './Allowlist';
import './GroupForm.scss';
import RequirementSubForm from './RequirementSubForm';
import TopicPermissionToggleGroupSubForm from './TopicPermissionToggleGroupSubForm';
import { REQUIREMENTS_TO_FULFILL } from './constants';
import {
  FormSubmitValues,
  GroupFormProps,
  Permission,
  RequirementSubFormsState,
  RequirementSubType,
  TopicPermissionToggleGroupSubFormsState,
} from './index.types';
import {
  VALIDATION_MESSAGES,
  groupValidationSchema,
  requirementSubFormValidationSchema,
} from './validations';

type TopicOption = {
  label: string;
  value: string | number;
  helpText?: string;
};

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
  const isERC721Requirement = requirementType === ERC_SPECIFICATIONS.ERC_721;
  const is1155Requirement = requirementType === ERC_SPECIFICATIONS.ERC_1155;
  const isTrustLevelRequirement = requirementType === TRUST_LEVEL_SPECIFICATION;
  const isSuiTokenRequirement = requirementType === TOKENS.SUI_TOKEN_TYPE;
  const isSuiNftRequirement = requirementType === SUI_NFT_SPECIFICATION;

  if (isTrustLevelRequirement) {
    return requirementSubFormValidationSchema.omit({
      requirementChain: true,
      requirementContractAddress: true,
      requirementCondition: true,
      requirementAmount: true,
      requirementTokenId: true,
      requirementCoinType: true,
    });
  }

  if (isSuiTokenRequirement) {
    return requirementSubFormValidationSchema.omit({
      requirementContractAddress: true,
      requirementTokenId: true,
      requirementTrustLevel: true,
    });
  }

  if (isSuiNftRequirement) {
    return requirementSubFormValidationSchema.omit({
      requirementTokenId: true,
      requirementTrustLevel: true,
      requirementCoinType: true,
    });
  }

  if (isTokenRequirement) {
    return requirementSubFormValidationSchema.omit({
      requirementContractAddress: true,
      requirementTokenId: true,
      requirementTrustLevel: true,
      requirementCoinType: true,
    });
  }

  if (is1155Requirement) {
    return requirementSubFormValidationSchema.omit({
      requirementTokenId: true,
      requirementTrustLevel: true,
      requirementCoinType: true,
    });
  }

  if (isERC721Requirement) {
    return requirementSubFormValidationSchema.omit({
      requirementTokenId: true,
      requirementTrustLevel: true,
      requirementCoinType: true,
    });
  }

  return requirementSubFormValidationSchema.omit({
    requirementTrustLevel: true,
    requirementCoinType: true,
    requirementTokenId: !isTokenRequirement,
  });
};

const GroupForm = ({
  formType,
  onSubmit,
  isSubmitting,
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
    includeTopics: true,
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
  const [
    topicPermissionsToggleGroupSubForms,
    setTopicPermissionsToggleGroupSubForms,
  ] = useState<TopicPermissionToggleGroupSubFormsState[]>([]);
  const [isProcessingProfileImage, setIsProcessingProfileImage] =
    useState(false);

  const topicPrivacyMap = new Map<number, boolean>();
  groups.forEach((group) => {
    (group.topics || []).forEach((topic) => {
      topicPrivacyMap.set(topic.id, topic.is_private);
    });
  });

  const currentGroup = groups.find((g) => g.name === initialValues.groupName);
  const privateTopicIds = new Set(
    (currentGroup?.topics || []).filter((t) => t.is_private).map((t) => t.id),
  );

  const topicOptions = sortedTopics
    .filter((topic) => topic.id !== undefined)
    .map((topic) => ({
      label: topic.name,
      value: topic.id as number,
      helpText: weightedVotingValueToLabel(topic.weighted_voting!),
    }));

  const handleImageProcessingChange = useCallback(
    ({ isGenerating, isUploading }) => {
      setIsProcessingProfileImage(isGenerating || isUploading);
    },
    [],
  );

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
            requirementCoinType: x?.requirementCoinType || '',
            requirementTrustLevel: x?.requirementTrustLevel?.value || '',
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
      const updatedInitialValues: TopicPermissionToggleGroupSubFormsState[] =
        initialValues.topics.map(
          ({ label, value, is_private, permission }) => ({
            topic: {
              id: Number(value),
              is_private,
              name: label,
            },
            permission: (Array.isArray(permission)
              ? permission.filter(isGatedAction)
              : []) as Permission[],
          }),
        );
      setTopicPermissionsToggleGroupSubForms(updatedInitialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicPermissionsChange = (
    updatedPermissions: TopicPermissionToggleGroupSubFormsState[],
  ) => {
    setTopicPermissionsToggleGroupSubForms(updatedPermissions);
  };

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
      const message = zodError.message;

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
        zodError.issues.map((x) => {
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
      topics: topicPermissionsToggleGroupSubForms.map((t) => ({
        id: t.topic.id,
        is_private: t.topic.is_private,
        permissions: t.permission,
      })),
      requirementsToFulfill,
      requirements: requirementSubForms.map((x) => x.values),
    };

    await onSubmit(formValues);
  };

  const handleWatchForm = (values: FormSubmitValues) => {
    if (values?.topics?.length > 0) {
      const updatedTopicPermissions: TopicPermissionToggleGroupSubFormsState[] =
        values.topics.map((topic) => {
          const existingTopic = topicPermissionsToggleGroupSubForms.find(
            (existing) => existing.topic.id === Number(topic.value),
          );
          const currentGroupTopic = (currentGroup?.topics || []).find(
            (t) => t.id === Number(topic.value),
          );
          return {
            topic: {
              id: Number(topic.value),
              is_private: currentGroupTopic?.is_private ?? false,
              name: topic.label,
            },
            permission: existingTopic?.permission || [],
          };
        });
      setTopicPermissionsToggleGroupSubForms(updatedTopicPermissions);
    } else {
      setTopicPermissionsToggleGroupSubForms([]);
    }
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
          groupImageUrl: initialValues.groupImageUrl || '',
          requirementsToFulfill: initialValues.requirementsToFulfill
            ? initialValues.requirementsToFulfill ===
              REQUIREMENTS_TO_FULFILL.ALL_REQUIREMENTS
              ? REQUIREMENTS_TO_FULFILL.ALL_REQUIREMENTS
              : REQUIREMENTS_TO_FULFILL.N_REQUIREMENTS
            : '',
          topics: (initialValues?.topics || [])
            .map((t) =>
              topicOptions.find((opt) => opt.value === Number(t.value)),
            )
            .filter(Boolean),
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

              <CWImageInput
                label="Group Image (Accepts JPG and PNG files)"
                onImageProcessingChange={handleImageProcessingChange}
                name="groupImageUrl"
                hookToForm
                imageBehavior={ImageBehavior.Circle}
                withAIImageGeneration
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
                    formIndex={index}
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
                  options={topicOptions}
                  components={{
                    Option: ({
                      data,
                      ...props
                    }: OptionProps<TopicOption, true>) => (
                      <components.Option {...props} data={data}>
                        {data.label}
                        {privateTopicIds.has(data.value) && (
                          <CWIcon
                            iconName="lockedNew"
                            iconSize="small"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </components.Option>
                    ),
                    SingleValue: ({
                      data,
                      ...props
                    }: SingleValueProps<TopicOption, true>) => (
                      <components.SingleValue {...props} data={data}>
                        {data.label}
                        {privateTopicIds.has(data.value) && (
                          <CWIcon
                            iconName="lockedNew"
                            iconSize="small"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </components.SingleValue>
                    ),
                    MultiValueLabel: ({
                      data,
                      ...props
                    }: MultiValueProps<TopicOption, true>) => (
                      <components.MultiValueLabel {...props} data={data}>
                        {data.label}
                        {privateTopicIds.has(data.value) && (
                          <CWIcon
                            iconName="lockedNew"
                            iconSize="small"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </components.MultiValueLabel>
                    ),
                  }}
                />
              </section>

              {/* Sub-section: Gated topic permissions */}
              {topicPermissionsToggleGroupSubForms.length > 0 && (
                <section className="form-section">
                  <div className="header-row">
                    <CWText
                      type="h4"
                      fontWeight="semiBold"
                      className="header-text"
                    >
                      Topic Gated Actions
                    </CWText>
                    <CWText type="b2">
                      Select the actions that members of this group can perform
                      in each topic. Non-members of this group can perform the
                      disabled actions unless they are gated by another group.
                    </CWText>
                    <CWText type="b2">
                      For example, if you enable the &apos;Create threads&apos;
                      option for a topic called &apos;General&apos;, only users
                      in this group can create threads in &apos;General&apos;,
                      but all users can comment, upvote, and vote in polls.
                    </CWText>
                  </div>
                  {topicPermissionsToggleGroupSubForms && (
                    <TopicPermissionToggleGroupSubForm
                      PermissionFormData={topicPermissionsToggleGroupSubForms}
                      onChange={handleTopicPermissionsChange}
                    />
                  )}
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
                  isSubmitting ||
                  isNameTaken ||
                  isProcessingProfileImage ||
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
