/* @jsx m */

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import ClassComponent from 'class_component';

import type Thread from 'client/scripts/models/Thread';
import { NewProfileActivityRow } from './profile_activity_row';
import type { CommentWithAssociatedThread } from './profile_activity';

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

    return allActivities.map((activity) => {
      return <NewProfileActivityRow activity={activity} address={address} />;
    });
  }
}
