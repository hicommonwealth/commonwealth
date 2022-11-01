/* @jsx m */

import m from 'mithril';

import app from 'state';
import { pluralize } from 'helpers';
import { Account, Thread, AddressInfo } from 'models';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';

export class ThreadAuthor
  implements
    m.Component<{
      thread: Thread;
    }>
{
  view(vnode) {
    const { thread } = vnode.attrs;

    const author: Account = app.chain.accounts.get(thread.author);

    return (
      <>
        {m(User, {
          avatarSize: 24,
          user: author,
          popover: true,
          linkify: true,
        })}
        {thread.collaborators?.length > 0 && (
          <>
            <CWText> and </CWText>
            <CWPopover
              interactionType="hover"
              hoverOpenDelay={500}
              content={thread.collaborators.map(({ address, chain }) => {
                return m(User, {
                  user: new AddressInfo(null, address, chain, null),
                  linkify: true,
                });
              })}
              trigger={
                <a href="#">
                  {pluralize(thread.collaborators?.length, 'other')}
                </a>
              }
            />
          </>
        )}
      </>
    );
  }
}
