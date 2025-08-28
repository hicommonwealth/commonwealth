import { GatedActionEnum } from '@hicommonwealth/shared';

export type RequirementSubFormsState = {
  defaultValues?: RequirementSubTypeWithLabel;
  values: RequirementSubType;
  errors?: RequirementSubType;
};

export type RequirementSubType = {
  requirementTrustLevel?: string;
  requirementType?: string;
  requirementContractAddress?: string;
  requirementChain?: string;
  requirementCondition?: string;
  requirementAmount?: string;
  requirementTokenId?: string;
  requirementCoinType?: string;
};

export const Permissions = GatedActionEnum;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export type Topic = {
  id: number;
  name: string;
  is_private: boolean;
};

export type TopicPermissionToggleGroupSubFormsState = {
  permission: GatedActionEnum[];
  topic: Topic;
};

export type TopicPermissionFormToggleGroupSubFormProps = {
  PermissionFormData: TopicPermissionToggleGroupSubFormsState[];
  onChange: (
    updatedPermissions: TopicPermissionToggleGroupSubFormsState[],
  ) => void;
};

export type LabelType = {
  label: string;
  value: string;
};

export type RequirementSubTypeWithLabel = {
  requirementTrustLevel?: LabelType;
  requirementCoinType?: string;
  requirementType?: LabelType;
  requirementContractAddress?: string;
  requirementChain?: LabelType;
  requirementCondition?: LabelType;
  requirementAmount?: string;
  requirementTokenId?: string;
};

export type RequirementSubFormType = {
  errors?: RequirementSubType;
  defaultValues: RequirementSubTypeWithLabel;
  onRemove: () => any;
  isRemoveable?: boolean;
  onChange: (values: RequirementSubType) => any;
};

export type GroupFormTopicSubmitValues = {
  id: number;
  permissions: Permission[];
};

export type GroupResponseValuesType = {
  groupName: string;
  groupDescription?: string;
  groupImageUrl?: string;
  requirementsToFulfill: 'ALL' | number;
  requirements?: RequirementSubType[];
  topics: GroupFormTopicSubmitValues[];
  allowlist?: number[];
};

export type GroupInitialValuesTypeWithLabel = {
  groupName: string;
  groupDescription?: string;
  groupImageUrl?: string;
  requirements?: RequirementSubTypeWithLabel[];
  requirementsToFulfill?: 'ALL' | number;
  topics: (LabelType & { is_private: boolean; permission: GatedActionEnum })[];
};

export type FormSubmitValues = {
  groupName: string;
  groupDescription?: string;
  groupImageUrl?: string;
  requirementsToFulfill: 'ALL' | 'N';
  topics: LabelType[];
};

export type GroupFormProps = {
  formType: 'create' | 'edit';
  onSubmit: (values: GroupResponseValuesType) => any;
  initialValues?: Partial<GroupInitialValuesTypeWithLabel>;
  onDelete?: () => any;
  allowedAddresses: string[];
  setAllowedAddresses: (
    value: ((prevState: string[]) => string[]) | string[],
  ) => void;
};
