import clsx from 'clsx';
import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';

import { CONTEST_FAQ_URL } from 'views/pages/CommunityManagement/Contests/utils';
import './ContestTopicBanner.scss';

interface ContestTopicBannerProps {
  contests?: {
    name?: string;
    address?: string;
    submittedEntries?: number;
  }[];
}

const ContestTopicBanner = ({ contests }: ContestTopicBannerProps) => {
  return (
    <CWBanner
      className="ContestTopicBanner"
      title="This topic has ongoing contest(s)."
      body={
        <div>
          Your thread will be submitted to the following contests:
          <ul>
            {contests?.map((contest) => {
              const disabled = (contest?.submittedEntries || 0) >= 2;
              return (
                <li key={contest.address}>
                  <CWText
                    type="b2"
                    className={clsx({
                      disabled,
                    })}
                  >
                    {contest.name}{' '}
                    {disabled && '(Reached max of 2 entries per contest)'}
                  </CWText>
                </li>
              );
            })}
          </ul>
          Once a post is submitted it cannot be edited. The post with the most
          upvotes will win the contest prize.
        </div>
      }
      type="info"
      footer={
        <a href={CONTEST_FAQ_URL} target="_blank" rel="noopener noreferrer">
          Learn more about contests
        </a>
      }
    />
  );
};

export default ContestTopicBanner;
