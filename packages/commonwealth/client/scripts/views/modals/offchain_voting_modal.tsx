/* @jsx m */

import m from 'mithril';

import 'modals/offchain_voting_modal.scss';

import { Vote, AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';

export class OffchainVotingModal
  implements m.ClassComponent<{ votes: Vote[] }>
{
  view(vnode) {
    const { votes } = vnode.attrs;

    if (!votes || votes.length === 0) return;

    const csvRows = [];

    votes.forEach((vote) => csvRows.push([vote.address, vote.option]));

    return (
      <div class="OffchainVotingModal">
        <div class="compact-modal-title">
          <h3>Votes</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          <div class="download-link">
            <a
              onclick={(e) => {
                e.preventDefault();
                const csvContent = `data:text/csv;charset=utf-8,${csvRows
                  .map((e) => e.join(','))
                  .join('\n')}`;
                const encodedUri = encodeURI(csvContent);
                window.open(encodedUri);
              }}
            >
              Download all votes as CSV
            </a>
          </div>
          {votes.map((vote) => (
            <div class="offchain-poll-voter">
              <div class="offchain-poll-voter-user">
                {m(User, {
                  avatarSize: 16,
                  popover: true,
                  linkify: true,
                  user: new AddressInfo(
                    null,
                    vote.address,
                    vote.authorChain,
                    null,
                    null
                  ),
                  hideIdentityIcon: true,
                })}
              </div>
              <div class="offchain-poll-voter-choice">{vote.option}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
