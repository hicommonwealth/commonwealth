import React, { useState } from 'react';

import EnableStake from './EnableStake';
import SignStakeTransactions from './SignStakeTransactions';

import './CommunityStakeStep.scss';

const CommunityStakeStep = () => {
  const [stake, setStake] = useState(false);

  return (
    <div className="CommunityStakeStep">
      <button onClick={() => setStake((prev) => !prev)}>flip it</button>
      {stake ? <EnableStake /> : <SignStakeTransactions />}
    </div>
  );
};

export default CommunityStakeStep;
