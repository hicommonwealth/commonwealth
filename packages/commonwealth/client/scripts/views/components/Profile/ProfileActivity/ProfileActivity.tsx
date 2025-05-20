import React, { useState } from 'react';

import './ProfileActivity.scss';

import { useFlag } from 'client/scripts/hooks/useFlag';
import { mapProfileThread } from 'client/scripts/utils/mapProfileThread';
import clsx from 'clsx';
import type Comment from 'models/Comment';
import type Thread from 'models/Thread';
import type { IUniqueId } from 'models/interfaces';
import useUserStore from 'state/ui/user';
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
  const newProfilePageEnabled = useFlag('newProfilePage');

  const [selectedActivity, setSelectedActivity] = useState(
    ProfileActivityType.Comments,
  );
  const user = useUserStore();

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
          {newProfilePageEnabled && (
            <CWTab
              label={
                <div className="tab-header">
                  Communities
                  <div className="count">{user.communities.length}</div>
                </div>
              }
              onClick={() => {
                setSelectedActivity(ProfileActivityType.Communities);
              }}
              isSelected={selectedActivity === ProfileActivityType.Communities}
            />
          )}
        </CWTabsRow>
      </div>
      <div
        className={clsx(
          'activity-content',
          selectedActivity === ProfileActivityType.Comments ||
            selectedActivity === ProfileActivityType.Threads
            ? 'removePadding'
            : '',
          selectedActivity === ProfileActivityType.Communities
            ? 'communityPadding'
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
