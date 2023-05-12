import React from 'react';

import { CWText } from '../component_kit/cw_text';
import type Thread from 'models/Thread';
import NewProfileActivityRow from './profile_activity_row';
import type { CommentWithAssociatedThread } from './profile_activity';

enum ProfileActivityType {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type ProfileActivityContentProps = {
  option: ProfileActivityType;
  threads: Thread[];
  comments: CommentWithAssociatedThread[];
};

const ProfileActivityContent = (props: ProfileActivityContentProps) => {
  const { option, comments, threads } = props;

  if (option === ProfileActivityType.Threads) {
    if (threads.length === 0) {
      return (
        <div className="empty-state">
          <CWText className="empty-state-text">
            You currently have no threads.
          </CWText>
          <CWText className="empty-state-text">
            Create a thread to see them here.
          </CWText>
        </div>
      );
    }
    return (
      <>
        {threads
          .sort((a, b) => +b.createdAt - +a.createdAt)
          .map((thread, i) => (
            <NewProfileActivityRow key={i} activity={thread} />
          ))}
      </>
    );
  }

  const allActivities: Array<CommentWithAssociatedThread | Thread> = [
    ...comments,
    ...threads,
  ].sort((a, b) => +b.createdAt - +a.createdAt);

  if (allActivities.length === 0) {
    return (
      <div className="empty-state">
        <CWText className="empty-state-text">
          You currently have no activity.
        </CWText>
        <CWText className="empty-state-text">
          Join or create a community to have activity.
        </CWText>
      </div>
    );
  }

  return (
    <>
      {allActivities.map((activity, i) => {
        return <NewProfileActivityRow key={i} activity={activity} />;
      })}
    </>
  );
};

export default ProfileActivityContent;
