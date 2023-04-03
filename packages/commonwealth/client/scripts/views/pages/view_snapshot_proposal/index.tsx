import React, { useEffect, useState } from 'react';

import type { SnapshotProposal, SnapshotProposalVote, SnapshotSpace } from 'helpers/snapshot_utils';
import { getPower, getResults } from 'helpers/snapshot_utils';
import { AddressInfo } from 'models';

import app from 'state';
import Sublayout from 'views/sublayout';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import { ActiveProposalPill, ClosedProposalPill } from '../../components/proposal_pills';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { User } from '../../components/user/user';
import { PageLoading } from '../loading';
import { SnapshotInformationCard } from './snapshot_information_card';
import { SnapshotPollCardContainer } from './snapshot_poll_card_container';
import { SnapshotVotesTable } from './snapshot_votes_table';

type ViewProposalPageProps = {
  identifier: string;
  scope: string;
  snapshotId: string;
};

export const ViewProposalPage = ({ identifier, scope, snapshotId }: ViewProposalPageProps) => {
  const [fetchedPower, setFetchedPower] = useState<boolean>(false);
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [scores, setScores] = useState<Array<number>>([]);
  const [space, setSpace] = useState<SnapshotSpace | null>(null);
  const [symbol, setSymbol] = useState<string>('');
  const [threads, setThreads] = useState<Array<{ id: string; title: string }> | null>(null);
  const [totals, setTotals] = useState<any>(null);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [validatedAgainstStrategies, setValidatedAgainstStrategies] = useState<boolean>(true);
  const [votes, setVotes] = useState<Array<SnapshotProposalVote>>([]);

  const loadVotes = async () => {
    setFetchedPower(false);

    console.log('all proposals:', app.snapshot.proposals);
    const currentProposal = app.snapshot.proposals.find((p) => p.id === identifier);
    setProposal(currentProposal);

    if (!currentProposal) {
      throw new Error(`could not get proposal: ${currentProposal.id}`);
    }

    const currentSpace = app.snapshot.space;
    setSpace(currentSpace);
    setSymbol(currentSpace.symbol); // TODO: remove this since it's a derived value?

    const results = await getResults(space, currentProposal);
    setVotes(results.votes);
    setTotals(results.results);

    const power = await getPower(currentSpace, currentProposal, app.user?.activeAccount?.address);
    setValidatedAgainstStrategies(power.totalScore > 0);
    setTotalScore(power.totalScore);

    setFetchedPower(true);

    try {
      if (app.activeChainId()) {
        const threadsForSnapshot = await app.threads.fetchThreadIdsForSnapshot({ snapshot: currentProposal.id });
        setThreads(threadsForSnapshot);
      }
    } catch (e) {
      console.error(`Failed to fetch threads: ${e}`);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!app.snapshot.initialized) {
        await app.snapshot.init(snapshotId);
        return;
      }
      await loadVotes();
    };
    init().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('proposal: ', proposal);

  if (!proposal) {
    return <PageLoading />;
  }

  return (
    <Sublayout
    // title="Snapshot Proposal"
    >
      <CWContentPage
        showSidebar
        title={proposal.title}
        author={
          <CWText>
            {!!app.activeChainId() && (
              <User
                user={new AddressInfo(null, proposal.author, app.activeChainId(), null)}
                showAddressWithDisplayName
                linkify
                popover
              />
            )}
          </CWText>
        }
        createdAt={proposal.created}
        contentBodyLabel="Snapshot"
        subHeader={
          proposal.state === 'active' ? (
            <ActiveProposalPill proposalEnd={proposal.end} />
          ) : (
            <ClosedProposalPill proposalState={proposal.state} />
          )
        }
        body={renderQuillTextBody(proposal.body)}
        subBody={votes.length > 0 && <SnapshotVotesTable choices={proposal.choices} symbol={symbol} voters={votes} />}
        sidebarComponents={[
          {
            label: 'Info',
            item: <SnapshotInformationCard proposal={proposal} threads={threads} />
          },
          {
            label: 'Poll',
            item: (
              <SnapshotPollCardContainer
                fetchedPower={fetchedPower}
                identifier={identifier}
                proposal={proposal}
                scores={scores}
                space={space}
                symbol={symbol}
                totals={totals}
                totalScore={totalScore}
                validatedAgainstStrategies={validatedAgainstStrategies}
                votes={votes}
              />
            )
          }
        ]}
      />
    </Sublayout>
  );
};

export default ViewProposalPage;
