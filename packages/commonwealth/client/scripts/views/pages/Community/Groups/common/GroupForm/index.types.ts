export type RequirementSubFormsState = {
  defaultValues?: RequirementSubTypeWithLabel;
  values: RequirementSubType;
  errors?: RequirementSubType;
};

export type CWRequirementsLabelInputFieldState = {
  value: string;
  error: string;
};

export type RequirementSubType = {
  requirementType?: string;
  requirementContractAddress?: string;
  requirementChain?: string;
  requirementCondition?: string;
  requirementAmount?: string;
  requirementTokenId?: string;
};

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

export type GroupResponseValuesType = {
  groupName: string;
  groupDescription?: string;
  requirementsToFulfill: 'ALL' | number;
  requirements?: RequirementSubType[];
  topics: LabelType[];
};

export type GroupInitialValuesTypeWithLabel = {
  groupName: string;
  groupDescription?: string;
  requirements?: RequirementSubTypeWithLabel[];
  requirementsToFulfill?: 'ALL' | number;
  topics: LabelType[];
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
};
