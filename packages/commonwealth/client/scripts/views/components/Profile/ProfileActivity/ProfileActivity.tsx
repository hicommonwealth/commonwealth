import React, { useState } from 'react';

import './ProfileActivity.scss';

import { mapProfileThread } from 'client/scripts/utils/mapProfileThread';
import clsx from 'clsx';
import type Comment from 'models/Comment';
import type Thread from 'models/Thread';
import type { IUniqueId } from 'models/interfaces';
import { CWTab, CWTabsRow } from '../../component_kit/new_designs/CWTabs';
import ProfileActivityContent, {
  ProfileActivityType,
} from './ProfileActivityContent';

export type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
};

type ProfileActivityProps = {
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
};

const ProfileActivity = ({ comments, threads }: ProfileActivityProps) => {
  const [selectedActivity, setSelectedActivity] = useState(
    ProfileActivityType.Comments,
  );

  return (
    <div className="ProfileActivity">
      <div className="activity-nav">
        <CWTabsRow>
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
          <CWTab
            label="Comments"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Comments);
            }}
            isSelected={selectedActivity === ProfileActivityType.Comments}
          />
          <CWTab
            label="My Tokens"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.MyTokens);
            }}
            isSelected={selectedActivity === ProfileActivityType.MyTokens}
          />
        </CWTabsRow>
      </div>
      <div
        className={clsx(
          'activity-content',
          selectedActivity === ProfileActivityType.Comments ||
            selectedActivity === ProfileActivityType.Threads
            ? 'removePadding'
            : '',
        )}
      >
        <ProfileActivityContent
          option={selectedActivity}
          threads={threads}
          comments={comments}
          mapProfileThread={mapProfileThread}
        />
      </div>
    </div>
  );
};

export default ProfileActivity;
