import React from 'react';
import { trpc } from 'utils/trpcClient';
import { CWText } from '../../../../component_kit/cw_text';

interface RoleProps {
  communityId: string;
}

export const Role = ({ communityId }: RoleProps) => {
  const { data: memberData } = trpc.community.getMembers.useQuery({
    community_id: communityId,
    limit: 1,
    include_roles: true,
  });

  const role = memberData?.results?.[0]?.addresses?.[0]?.role || 'member';

  return (
    <CWText type="b1" className="neutral-500">
      {role}
    </CWText>
  );
};
