import React, { useState } from 'react';

import './ProfileActivity.scss';

import { useFlag } from 'hooks/useFlag';
import type Comment from 'models/Comment';
import type Thread from 'models/Thread';
import type { IUniqueId } from 'models/interfaces';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import ProfileActivityContent, {
  ProfileActivityType,
} from './ProfileActivityContent';

export type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
};

type ProfileActivityProps = {
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
  isOwner: boolean | undefined;
};

const ProfileActivity = ({
  comments,
  threads,
  isOwner,
}: ProfileActivityProps) => {
  const [selectedActivity, setSelectedActivity] = useState(
    ProfileActivityType.Comments,
  );

  const referralsEnabled = useFlag('referrals');

  return (
    <div className="ProfileActivity">
      <div className="activity-nav">
        <CWTabsRow>
          <CWTab
            label="All Activity"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Comments);
            }}
            isSelected={selectedActivity === ProfileActivityType.Comments}
          />
          <CWTab
            label={
              <div className="tab-header">
                Threads
                <div className="count">{threads.length}</div>
              </div>
            }
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Threads);
            }}
            isSelected={selectedActivity === ProfileActivityType.Threads}
          />
          {referralsEnabled && (
            <CWTab
              isSelected={selectedActivity === ProfileActivityType.Referrals}
              label={
                <div className="tab-header">
                  Referrals
                  <div className="count">5</div>
                </div>
              }
              onClick={() => {
                setSelectedActivity(ProfileActivityType.Referrals);
              }}
            />
          )}
        </CWTabsRow>
      </div>
      <div className="activity-content">
        <ProfileActivityContent
          option={selectedActivity}
          threads={threads}
          comments={comments}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
};

export default ProfileActivity;
