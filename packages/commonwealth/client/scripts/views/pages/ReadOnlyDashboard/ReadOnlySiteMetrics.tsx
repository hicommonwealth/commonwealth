import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import Permissions from 'utils/Permissions';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../../components/component_kit/cw_text';

const ReadOnlySiteMetrics = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!Permissions.isSiteAdmin()) {
      // redirect to 404
      navigate('/404');
    }
  }, [navigate]);

  const { data: communities } = useFetchCommunitiesQuery({
    limit: 50,
    cursor: 0,
    include_node_info: true,
  });

  return (
    <CWPageLayout>
      <div className="ReadOnlySiteMetrics">
        <CWText type="h2">Site Metrics Dashboard</CWText>
        <CWText>
          Total number of communities: {communities?.pages?.[0]?.totalResults}
        </CWText>
      </div>
    </CWPageLayout>
  );
};

export default ReadOnlySiteMetrics;
