import 'pages/AdminPanel.scss';
import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import { downloadCSV as downloadAsCSV, getTopUsersList } from './utils';

const TopUsers = () => {
  const generateAndDownload = async () => {
    const result = await getTopUsersList();
    downloadAsCSV(result, 'top_users.csv');
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
        />
      </div>
    </div>
  );
};

export default TopUsers;
