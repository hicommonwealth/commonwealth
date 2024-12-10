import { PermissionEnum } from '@hicommonwealth/schemas';
import { PermissionLabel, TOPIC_PERMISSIONS } from './constants';

export enum GroupTopicPermissionEnum {
  UPVOTE = 'UPVOTE',
  UPVOTE_AND_COMMENT = 'UPVOTE_AND_COMMENT',
  UPVOTE_AND_COMMENT_AND_POST = 'UPVOTE_AND_COMMENT_AND_POST',
}

export type RequirementSubFormsState = {
  defaultValues?: RequirementSubTypeWithLabel;
  values: RequirementSubType;
  errors?: RequirementSubType;
};

export type RequirementSubType = {
  requirementType?: string;
  requirementContractAddress?: string;
  requirementChain?: string;
  requirementCondition?: string;
  requirementAmount?: string;
  requirementTokenId?: string;
};

export type TopicPermissions =
  (typeof TOPIC_PERMISSIONS)[keyof typeof TOPIC_PERMISSIONS];

export type TopicPermissionsSubFormsState = {
  topic: TopicPermissionsSubFormType['topic'];
  permission: TopicPermissions;
};

export type TopicPermissionsSubFormType = {
  topic: { id: number; name: string };
  defaultPermission?: TopicPermissions;
  onPermissionChange: (permission: string) => void;
};

export const Permissions = PermissionEnum;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export type Topic = {
  id: number;
  name: string;
};

export type TopicPermissionToggleGroupSubFormsState = {
  permission: Permission[];
  topic: Topic;
};

export type TopicPermissionFormToggleGroupSubFormProps = {
  PermissionFormData: TopicPermissionToggleGroupSubFormsState[];
  onChange: (
    updatedPermissions: TopicPermissionToggleGroupSubFormsState[],
  ) => void;
};

export type PermissionLabelType = (typeof PermissionLabel)[number];

export type LabelType = {
  label: string;
  value: string;
};

export type RequirementSubTypeWithLabel = {
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
  requirementsToFulfill: 'ALL' | number;
  requirements?: RequirementSubType[];
  topics: GroupFormTopicSubmitValues[];
  allowlist?: number[];
};

export type GroupInitialValuesTypeWithLabel = {
  groupName: string;
  groupDescription?: string;
  requirements?: RequirementSubTypeWithLabel[];
  requirementsToFulfill?: 'ALL' | number;
  topics: (LabelType & { permission: TopicPermissions })[];
};

export type FormSubmitValues = {
  groupName: string;
  groupDescription?: string;
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
