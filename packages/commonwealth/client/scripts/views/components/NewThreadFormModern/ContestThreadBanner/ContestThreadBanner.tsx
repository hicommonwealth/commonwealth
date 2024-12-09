import React from 'react';

import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CONTEST_FAQ_URL } from 'views/pages/CommunityManagement/Contests/utils';

import './ContestThreadBanner.scss';

const ContestThreadBanner = () => {
  return (
    <CWBanner
      className="ContestThreadBanner"
      title="This topic has an ongoing contest(s). Submit thread to contest?"
      body="Once a post is submitted it cannot be edited.
      The post with the most upvotes will win the contest prize."
      type="info"
      footer={
        <a href={CONTEST_FAQ_URL} target="_blank" rel="noopener noreferrer">
          Learn more about contests
        </a>
      }
    />
  );
};

export default ContestThreadBanner;
