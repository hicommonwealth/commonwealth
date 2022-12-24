/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'modals/offchain_voting_modal.scss';

import { Vote, AddressInfo } from 'models';
import User from 'views/components/widgets/user';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';

type OffchainVotingModalAttrs = {
  votes: Array<Vote>;
};

export class OffchainVotingModal extends ClassComponent<OffchainVotingModalAttrs> {
  view(vnode: ResultNode<OffchainVotingModalAttrs>) {
    const { votes } = vnode.attrs;

    if (!votes || votes.length === 0) return;

    const csvRows = [];

    votes.forEach((vote) => csvRows.push([vote.address, vote.option]));

    return (
      <div className="OffchainVotingModal">
        <div className="compact-modal-title">
          <h3>Votes</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <div className="download-link">
            <a
              onClick={(e) => {
                e.preventDefault();
                const csvContent = `data:text/csv;charset=utf-8,${csvRows
                  .map((r) => r.join(','))
                  .join('\n')}`;
                const encodedUri = encodeURI(csvContent);
                window.open(encodedUri);
              }}
            >
              Download all votes as CSV
            </a>
          </div>
          {votes.map((vote) => (
            <div className="offchain-poll-voter">
              <div className="offchain-poll-voter-user">
                {render(User, {
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
              <div className="offchain-poll-voter-choice">{vote.option}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
