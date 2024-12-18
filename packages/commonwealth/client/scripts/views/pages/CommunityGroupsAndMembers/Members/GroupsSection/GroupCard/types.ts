import { PermissionEnum } from '@hicommonwealth/schemas';
import MinimumProfile from 'models/MinimumProfile';

export type RequirementCardProps = {
  requirementType: string;
  requirementChain: string;
  requirementContractAddress?: string;
  requirementCondition: string;
  requirementAmount: string;
  requirementTokenId?: string;
};

export type GroupCardProps = {
  isJoined?: boolean;
  groupName: string;
  groupDescription?: string;
  requirements?: RequirementCardProps[]; // This represents erc requirements
  requirementsToFulfill: 'ALL' | number;
  allowLists?: string[];
  topics: { id: number; name: string; permissions?: PermissionEnum[] }[];
  canEdit?: boolean;
  onEditClick?: () => void;
  profiles?: Map<string, MinimumProfile>;
};
