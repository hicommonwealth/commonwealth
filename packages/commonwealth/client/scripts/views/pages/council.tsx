/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import { navigateToSubpage } from 'router';
import { ChainBase, ProposalType } from 'common-common/src/types';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import type Substrate from 'controllers/chain/substrate/adapter';
import type { PhragmenElectionVote } from 'controllers/chain/substrate/phragmen_election';
import { pluralize } from 'helpers';

import 'pages/council.scss';

import app, { ApiStatus } from 'state';
import { CountdownUntilBlock } from 'views/components/countdown';
import { loadSubstrateModules } from 'views/components/load_substrate_modules';
import { User } from 'views/components/user/user';
import { CouncilVotingModal } from 'views/modals/council_voting_modal';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CardsCollection } from '../components/cards_collection';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCard } from '../components/component_kit/cw_card';
import { CWText } from '../components/component_kit/cw_text';
import { GovExplainer } from '../components/gov_explainer';

type CouncillorAttrs = {
  account: SubstrateAccount;
};

class Councillor extends ClassComponent<CouncillorAttrs> {
  view(vnode: ResultNode<CouncillorAttrs>) {
    if (!vnode.attrs.account) return;

    const { account } = vnode.attrs;

    // TODO: refactor this logic to the top level
    const election = (app.chain as Substrate).phragmenElections;

    const votes: PhragmenElectionVote[] = (
      app.chain as Substrate
    ).phragmenElections.activeElection
      ?.getVotes()
      .filter((v) => v.votes.includes(account.address));

    return (
      <CWCard className="CouncillorCard">
        <User user={account} popover hideIdentityIcon />
        <CWText className="councillor-status-text">
          {election.isMember(account)
            ? `${election.backing(account).format(true)} from ${pluralize(
                votes?.length || 0,
                'voter'
              )}`
            : election.isRunnerUp(account)
            ? `${election
                .runnerUpBacking(account)
                .format(true)} from ${pluralize(votes?.length || 0, 'voter')}`
            : `??? from ${pluralize(votes?.length || 0, 'voter')}`}
        </CWText>
      </CWCard>
    );
  }
}

const getCouncillors = () => {
  if (app.chain.base !== ChainBase.Substrate) {
    return null;
  }

  const councillors: SubstrateAccount[] =
    app.chain &&
    ((app.chain as Substrate).phragmenElections.members || [])
      .map((a) => app.chain.accounts.get(a))
      .sort((a, b) => {
        const va = (app.chain as Substrate).phragmenElections.backing(a);
        const vb = (app.chain as Substrate).phragmenElections.backing(b);
        if (va === undefined || vb === undefined) return 0;
        return vb.cmp(va);
      });

  return councillors;
};

const getCouncilCandidates = () => {
  if (app.chain.base !== ChainBase.Substrate) {
    return null;
  }

  const candidates: Array<[SubstrateAccount, number]> =
    app.chain &&
    (
      (app.chain as Substrate).phragmenElections.activeElection?.candidates ||
      []
    )
      .map((s): [SubstrateAccount, number] => [app.chain.accounts.get(s), null])
      .sort((a, b) => {
        const va = (app.chain as Substrate).phragmenElections.backing(a[0]);
        const vb = (app.chain as Substrate).phragmenElections.backing(b[0]);
        if (va === undefined || vb === undefined) return 0;
        return vb.cmp(va);
      });

  return candidates;
};

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }

  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.phragmenElections];
  } else {
    throw new Error('invalid chain');
  }
}

class CouncilPage extends ClassComponent {
  view() {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Could not connect to chain"
            title={<BreadcrumbsTitleTag title="Council" />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          title={<BreadcrumbsTitleTag title="Council" />}
        />
      );
    }

    const modLoading = loadSubstrateModules('Council', getModules);

    if (modLoading) return modLoading;

    const candidates = getCouncilCandidates();
    const councillors = getCouncillors();

    const activeAccountIsCandidate =
      app.chain &&
      app.user.activeAccount &&
      app.user.activeAccount.chain.base === ChainBase.Substrate &&
      !!candidates.find(
        ([who]) => who.address === app.user.activeAccount.address
      );

    const nRunnersUpSeats = (app.chain as Substrate).phragmenElections
      .desiredRunnersUp;

    const nextRoundStartBlock = (app.chain as Substrate).phragmenElections
      .activeElection?.endTime.blocknum;

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Council" />}
      >
        <div className="CouncilPage">
          <GovExplainer
            statHeaders={[
              {
                statName: 'Councillors',
                statDescription: `are elected by coin holders to govern the network. The \
                council can approve/reject treasury proposals, propose simple-majority referenda, \
                or create fast-track referenda.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Councillors:',
                stat: councillors?.length,
              },
              {
                statHeading: 'Runners-up:',
                stat: Math.min(
                  candidates?.length - councillors?.length,
                  nRunnersUpSeats
                ),
              },
              {
                statHeading: 'Next election finishes:',
                stat: nextRoundStartBlock ? (
                  <CountdownUntilBlock
                    block={nextRoundStartBlock}
                    includeSeconds={false}
                  />
                ) : (
                  '--'
                ),
              },
            ]}
            statAction={
              app.user.activeAccount &&
              app.user.activeAccount instanceof SubstrateAccount &&
              app.chain.networkStatus === ApiStatus.Connected && (
                <React.Fragment>
                  <CWButton
                    onClick={(e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: CouncilVotingModal,
                        data: { candidates },
                      });
                    }}
                    label="Vote"
                  />
                  <CWButton
                    onClick={(e) => {
                      e.preventDefault();
                      if (activeAccountIsCandidate) {
                        return;
                      }

                      navigateToSubpage('/new/proposal/:type', {
                        type: ProposalType.PhragmenCandidacy,
                      });
                    }}
                    label={
                      activeAccountIsCandidate
                        ? 'Already a council candidate'
                        : 'Run for council'
                    }
                  />
                </React.Fragment>
              )
            }
          />
          <CardsCollection
            content={councillors.map((account) => (
              <Councillor account={account} />
            ))}
            header="Councillors"
          />
          <CardsCollection
            content={candidates
              .filter(([account]) => !councillors.includes(account))
              .map(([account]) => (
                <Councillor account={account} />
              ))}
            header="Runners-up"
          />
        </div>
      </Sublayout>
    );
  }
}

export default CouncilPage;
