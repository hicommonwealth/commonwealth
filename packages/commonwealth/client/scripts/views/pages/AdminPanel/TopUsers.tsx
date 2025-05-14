import useGetTopUsersQuery from 'client/scripts/state/api/superAdmin/getTopUsers';
import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import './AdminPanel.scss';
import { downloadCSV as downloadAsCSV } from './utils';

const TopUsers = () => {
  const [trigger, setTrigger] = React.useState(false);
  const { data: topUsers, isLoading: isLoadingTopUsers } =
    useGetTopUsersQuery(trigger);

  React.useEffect(() => {
    if (trigger && topUsers && !isLoadingTopUsers) {
      downloadAsCSV(topUsers, 'top_users.csv');
      setTrigger(false); // reset after download
    }
  }, [trigger, topUsers, isLoadingTopUsers]);

  const generateAndDownload = () => {
    setTrigger(true);
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Download Top Users List</CWText>
      <CWText type="caption">
        Generates a CSV file containing the top 150 users, ranked by total
        activity (threads and comments created).
      </CWText>
      <div className="TaskRow">
        <CWButton
          label="Generate and Download"
          className="TaskButton"
          onClick={generateAndDownload}
          disabled={trigger}
        />
      </div>
    </div>
  );
};

export default TopUsers;
