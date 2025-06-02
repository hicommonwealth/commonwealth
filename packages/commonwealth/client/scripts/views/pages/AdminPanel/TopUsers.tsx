import useGetTopUsersQuery from 'client/scripts/state/api/superAdmin/getTopUsers';
import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleRingSpinner from '../../components/component_kit/new_designs/CWCircleRingSpinner';
import './AdminPanel.scss';
import { downloadCSV as downloadAsCSV } from './utils';

const TopUsers = () => {
  const {
    data: topUsers,
    isFetching: isFetchingTopUsers,
    refetch: refetchTopUsers,
  } = useGetTopUsersQuery(false);

  React.useEffect(() => {
    !isFetchingTopUsers && topUsers && downloadAsCSV(topUsers, 'top_users.csv');
  }, [topUsers, isFetchingTopUsers]);

  return (
    <div className="TaskGroup">
      <CWText type="h4">Download Top Users List</CWText>
      <CWText type="caption">
        Generates a CSV file containing the top 150 users, ranked by total
        activity (threads and comments created).
      </CWText>
      <div className="TaskRow">
        {isFetchingTopUsers ? (
          <>
            <CWCircleRingSpinner />
            <CWText type="caption">Fetching top users, please wait...</CWText>
          </>
        ) : (
          <CWButton
            label="Generate and Download"
            className="TaskButton"
            onClick={() => refetchTopUsers()}
          />
        )}
      </div>
    </div>
  );
};

export default TopUsers;
