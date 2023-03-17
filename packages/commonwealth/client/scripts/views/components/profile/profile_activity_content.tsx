/* @jsx m */

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import ClassComponent from 'class_component';

import type Thread from 'client/scripts/models/Thread';
import { NewProfileActivityRow } from './profile_activity_row';
import type { CommentWithAssociatedThread } from './profile_activity';
import { CWText } from '../component_kit/cw_text';

enum ProfileActivityType {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type ProfileActivityContentAttrs = {
  address: string;
  option: ProfileActivityType;
  threads: Thread[];
  comments: CommentWithAssociatedThread[];
};

export class ProfileActivityContent extends ClassComponent<ProfileActivityContentAttrs> {
  view(vnode: m.Vnode<ProfileActivityContentAttrs>) {
    const { option, address, comments, threads } = vnode.attrs;

    if (option === ProfileActivityType.Threads) {
      if (threads.length === 0) {
        return (
          <div class="empty-state">
            <CWText className="empty-state-text">
              You currently have no threads.
            </CWText>
            <CWText className="empty-state-text">
              Create a thread to see them here.
            </CWText>
          </div>
        );
      }
      return threads
        .sort((a, b) => +b.createdAt - +a.createdAt)
        .map((thread) => (
          <NewProfileActivityRow activity={thread} address={address} />
        ));
    }

    const allActivities: Array<CommentWithAssociatedThread | Thread> = [
      ...comments,
      ...threads,
    ].sort((a, b) => +b.createdAt - +a.createdAt);

    if (allActivities.length === 0) {
      return (
        <div class="empty-state">
          <CWText className="empty-state-text">
            You currently have no activity.
          </CWText>
          <CWText className="empty-state-text">
            Join or create a community to have activity.
          </CWText>
        </div>
      );
    }

    return allActivities.map((activity) => {
      return <NewProfileActivityRow activity={activity} address={address} />;
    });
  }
}
