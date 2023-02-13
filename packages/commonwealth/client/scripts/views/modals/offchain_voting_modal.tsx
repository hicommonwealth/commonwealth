/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'modals/offchain_voting_modal.scss';

import type { Vote } from 'models';
import { AddressInfo } from 'models';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import User from 'views/components/widgets/user';
import AddressAccount from "models/Address";
import app from "state";

type OffchainVotingModalAttrs = {
  votes: Array<Vote>;
};

export class OffchainVotingModal extends ClassComponent<OffchainVotingModalAttrs> {
  view(vnode: m.Vnode<OffchainVotingModalAttrs>) {
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
            <div class="offchain-poll-voter">
              <div class="offchain-poll-voter-user">
                {m(User, {
                  avatarSize: 16,
                  popover: true,
                  linkify: true,
                  user: new AddressAccount({
                    address: vote.address,
                    chain: app.config.chains.getById(vote.authorChain)
                  }),
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
