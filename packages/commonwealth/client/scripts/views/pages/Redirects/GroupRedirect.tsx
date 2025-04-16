import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchGroupsQuery } from 'state/api/groups';
import { PageLoading } from '../loading';

const GroupRedirect = ({ id }: { id: string }) => {
  const navigate = useCommonNavigate();

  const { data: groups, error } = useFetchGroupsQuery({
    groupId: `${id || '0'}`,
    enabled: !!id.trim(),
  });
  const group = groups?.[0];

  useRunOnceOnCondition({
    callback: () => {
      !group || error
        ? navigate('/error')
        : navigate(
            `/members?tab=groups&groupId=${group.id}`,
            { replace: true },
            group?.communityId,
          );
    },
    shouldRun: !!(group || error),
  });

  return <PageLoading />;
};

export default GroupRedirect;
