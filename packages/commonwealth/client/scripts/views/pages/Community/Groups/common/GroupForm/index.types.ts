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
