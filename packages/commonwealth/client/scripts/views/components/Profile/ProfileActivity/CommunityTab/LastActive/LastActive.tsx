import React from 'react';
import { trpc } from 'utils/trpcClient';
import { CWText } from '../../../../component_kit/cw_text';

interface LastActiveProps {
  communityId: string;
}

export const LastActive = ({ communityId }: LastActiveProps) => {
  const { data: memberData } = trpc.community.getMembers.useQuery({
    community_id: communityId,
    limit: 1,
    order_by: 'last_active',
    include_roles: true,
  });

  const lastActive = memberData?.results?.[0]?.last_active;
  const formattedDate = lastActive
    ? new Date(lastActive).toLocaleDateString()
    : '-';

  return <CWText>{formattedDate}</CWText>;
};
