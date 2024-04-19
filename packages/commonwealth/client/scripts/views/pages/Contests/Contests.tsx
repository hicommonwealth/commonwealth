import React from 'react';
import { Navigate } from 'react-router-dom';

import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';

import './Contests.scss';

const Contests = () => {
  const contestsItemVisible = false;

  if (!contestsItemVisible) {
    return <Navigate replace to={`/${app.activeChainId()}`} />;
  }

  return (
    <CWPageLayout>
      <div className="Contests">Contests</div>
    </CWPageLayout>
  );
};

export default Contests;
