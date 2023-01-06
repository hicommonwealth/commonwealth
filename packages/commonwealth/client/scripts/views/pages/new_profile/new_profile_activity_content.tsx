/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import Thread from 'client/scripts/models/Thread';
import { ChainInfo } from 'client/scripts/models';
import { NewProfileActivityRow } from './new_profile_activity_row';
import { CommentWithAssociatedThread } from './new_profile_activity';

enum ProfileActivity {
  Addresses,
  Comments,
  Communities,
  Threads,
}

type NewProfileActivityContentAttrs = {
  address: string;
  option: ProfileActivity;
  threads: Thread[];
  comments: CommentWithAssociatedThread[];
  chains: ChainInfo[];
};

export class NewProfileActivityContent extends ClassComponent<NewProfileActivityContentAttrs> {
  view(vnode: m.Vnode<NewProfileActivityContentAttrs>) {
    const { option, address, comments, threads, chains } =
      vnode.attrs;

    if (option === ProfileActivity.Threads) {
      return threads.sort(((a, b) => +b.createdAt - +a.createdAt)).map((thread) => (
        <NewProfileActivityRow
          activity={thread}
          address={address}
          chains={chains}
        />
      ));
    }

    const allActivities: Array<CommentWithAssociatedThread | Thread> = [...comments, ...threads].sort(
      (a, b) => +b.createdAt - +a.createdAt
    );

    return allActivities.map((activity) => {
      return (
        <NewProfileActivityRow
          activity={activity}
          address={address}
          chains={chains}
        />
      );
    });
  }
}
