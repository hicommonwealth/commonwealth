/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/snapshot/snapshot_information.scss';

import app from 'state';
import { AddressInfo } from 'models';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCard } from '../../components/component_kit/cw_card';
import User from '../../components/widgets/user';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ProposalHeaderSnapshotThreadLink } from '../view_proposal/proposal_header_links';

type SnapshotInformationAttrs = {
  proposal: SnapshotProposal;
  threads: Array<{ id: string; title: string }> | null;
};

export class SnapshotInformation
  implements m.ClassComponent<SnapshotInformationAttrs>
{
  view(vnode) {
    const { proposal, threads } = vnode.attrs;

    return (
      <CWCard elevation="elevation-1" className="SnapshotInformation">
        <CWText type="h3" fontWeight="semiBold">
          Information
        </CWText>
        <div class="info-block">
          <div class="labels">
            <p>Author</p>
            <p>IPFS</p>
            <p>Voting System</p>
            <p>Start Date</p>
            <p>End Date</p>
            <p>{proposal.strategies.length > 1 ? 'Strategies' : 'Strategy'}</p>
            <p>Snapshot</p>
          </div>
          <div class="values">
            {m(User, {
              user: new AddressInfo(
                null,
                proposal.author,
                app.activeChainId(),
                null
              ),
              linkify: true,
              popover: true,
            })}
            <a
              class="snapshot-link -mt-10"
              href={`https://ipfs.fleek.co/ipfs/${proposal.ipfs}`}
              target="_blank"
            >
              <div class="truncate">#{proposal.ipfs}</div>
              <CWIcon iconName="externalLink" iconSize="small" />
            </a>
            <div class="snapshot-type">
              {proposal.type.split('-').join(' ').concat(' voting')}
            </div>
            <p>{moment(+proposal.start * 1000).format('lll')}</p>
            <p>{moment(+proposal.end * 1000).format('lll')}</p>
            <a
              class="snapshot-link"
              href={`https://snapshot.org/#/${app.snapshot.space.id}/proposal/${proposal.id}`}
              target="_blank"
            >
              <div class="truncate">
                {proposal.strategies.length > 1
                  ? `${proposal.strategies.length} Strategies`
                  : proposal.strategies[0].name}
              </div>
              <CWIcon iconName="externalLink" iconSize="small" />
            </a>
            <a
              class="snapshot-link"
              href={`https://etherscan.io/block/${proposal.snapshot}`}
              target="_blank"
            >
              <div class="truncate">#{proposal.snapshot}</div>
              <CWIcon iconName="externalLink" iconSize="small" />
            </a>
          </div>
        </div>
        {threads !== null && (
          <div class="linked-discussion">
            <div class="heading-2">Linked Discussions</div>
            {threads.map((thread) => (
              <ProposalHeaderSnapshotThreadLink thread={thread} />
            ))}
          </div>
        )}
      </CWCard>
    );
  }
}
