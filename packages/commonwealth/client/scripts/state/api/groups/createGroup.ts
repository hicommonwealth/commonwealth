import { trpc } from 'utils/trpcClient';
import { GroupFormTopicSubmitValues } from 'views/pages/CommunityGroupsAndMembers/Groups/common/GroupForm/index.types';

interface CreateGroupProps {
  communityId: string;
  address: string;
  groupName: string;
  topics: GroupFormTopicSubmitValues[];
  groupDescription?: string;
  groupImageUrl?: string;
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

export const buildCreateGroupInput = ({
  communityId,
  groupName,
  groupDescription,
  groupImageUrl,
  topics,
  requirementsToFulfill,
  requirements = [],
}: CreateGroupProps) => {
  const finalRequirementsToFulfill =
    requirementsToFulfill === 0 ? requirements.length : requirementsToFulfill;
  return {
    community_id: communityId,
    metadata: {
      name: groupName,
      description: groupDescription ?? '',
      groupImageUrl: groupImageUrl ?? '',
      ...(finalRequirementsToFulfill && {
        required_requirements: finalRequirementsToFulfill,
      }),
    },
    requirements,
    topics,
  };
};

const useCreateGroupMutation = ({ communityId }: { communityId: string }) => {
  const utils = trpc.useUtils();
  return trpc.community.createGroup.useMutation({
    onSuccess: async () => {
      await utils.community.getGroups.invalidate({ community_id: communityId });
    },
  });
};

export default useCreateGroupMutation;
