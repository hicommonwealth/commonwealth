export type RequirementSubType = {
  requirementType?: string;
  requirementContractAddress?: string;
  requirementChain?: string;
  requirementCondition?: string;
  requirementAmount?: string;
};

export type RequirementSubFormType = {
  errors?: RequirementSubType;
  onRemove: () => any;
  onChange: (values: RequirementSubType) => any;
};

export type GroupType = {
  groupName: string;
  groupDescription?: string;
  requirements?: RequirementSubType[];
  topics: string[];
};

export type GroupFormProps = {
  formType: 'create-group' | 'edit-group';
  onSubmit: (values: GroupType) => any;
};
