/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import { capitalize } from 'lodash';

import 'pages/snapshot/snapshot_information.scss';

import app from 'state';
import { AddressInfo } from 'models';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCard } from '../../components/component_kit/cw_card';
import User from '../../components/widgets/user';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ProposalHeaderSnapshotThreadLink } from '../view_proposal/proposal_header_links';

type SnapshotInfoRowAttrs = {
  label: string;
  value: string;
};

class SnapshotInfoRow implements m.ClassComponent<SnapshotInfoRowAttrs> {
  view(vnode) {
    const { label, value } = vnode.attrs;

    return (
      <div class="SnapshotInfoRow">
        <CWText type="caption" className="snapshot-info-row-label">
          {label}
        </CWText>
        <CWText noWrap>{value}</CWText>
      </div>
    );
  }
}

class SnapshotInfoLinkRow
  implements m.ClassComponent<SnapshotInfoRowAttrs & { url: string }>
{
  view(vnode) {
    const { label, url, value } = vnode.attrs;

    return (
      <div class="SnapshotInfoRow">
        <CWText type="caption" className="snapshot-info-row-label">
          {label}
        </CWText>
        <a href={url} target="_blank">
          <CWText className="snapshot-link" noWrap>
            {value}
          </CWText>
          <CWIcon iconName="externalLink" iconSize="small" />
        </a>
      </div>
    );
  }
}

type SnapshotInformationAttrs = {
  proposal: SnapshotProposal;
  threads: Array<{ id: string; title: string }> | null;
};

export class SnapshotInformation
  implements m.ClassComponent<SnapshotInformationAttrs>
{
  view(vnode) {
    const { proposal, threads } = vnode.attrs;

    const votingSystem = capitalize(
      proposal.type.split('-').join(' ').concat(' voting')
    );

    return (
      <CWCard elevation="elevation-1" className="SnapshotInformation">
        <CWText type="h3" fontWeight="semiBold">
          Information
        </CWText>
        <div class="info-rows-container">
          <SnapshotInfoRow
            label="Author"
            value={m(User, {
              user: new AddressInfo(
                null,
                proposal.author,
                app.activeChainId(),
                null
              ),
              hideAvatar: true,
              linkify: true,
              popover: true,
            })}
          />
          <SnapshotInfoLinkRow
            label="IPFS"
            value={`#${proposal.ipfs}`}
            url={`https://ipfs.fleek.co/ipfs/${proposal.ipfs}`}
          />
          <SnapshotInfoRow label="Voting System" value={votingSystem} />
          <SnapshotInfoRow
            label="Start Date"
            value={moment(+proposal.start * 1000).format('lll')}
          />
          <SnapshotInfoRow
            label="End Date"
            value={moment(+proposal.end * 1000).format('lll')}
          />
          <SnapshotInfoLinkRow
            label={proposal.strategies.length > 1 ? 'Strategies' : 'Strategy'}
            value={
              proposal.strategies.length > 1
                ? `${proposal.strategies.length} Strategies`
                : proposal.strategies[0].name
            }
            url={`https://snapshot.org/#/${app.snapshot.space.id}/proposal/${proposal.id}`}
          />
          <SnapshotInfoLinkRow
            label="Snapshot"
            value={`#${proposal.snapshot}`}
            url={`https://etherscan.io/block/${proposal.snapshot}`}
          />
        </div>
        {!!threads && (
          <div class="linked-discussions">
            <CWText type="h5" fontWeight="semiBold">
              Linked Discussions
            </CWText>
            {threads.map((thread) => (
              <ProposalHeaderSnapshotThreadLink thread={thread} />
            ))}
          </div>
        )}
      </CWCard>
    );
  }
}
