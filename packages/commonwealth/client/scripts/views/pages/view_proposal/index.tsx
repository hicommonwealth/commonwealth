/* @jsx m */

import { navigateToSubpage } from 'router';
import ClassComponent from 'class_component';
import { ChainBase } from 'common-common/src/types';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import type Substrate from 'controllers/chain/substrate/adapter';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import {
  chainToProposalSlug,
  getProposalUrlPath,
  idToProposal,
  proposalSlugToClass,
} from 'identifiers';
import m from 'mithril';
import type { AnyProposal, ProposalModule } from 'models';
import { Account } from 'models';

import app from 'state';
import { slugify } from 'utils';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CollapsibleProposalBody } from '../../components/collapsible_body_text';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import User from '../../components/widgets/user';
import { TipDetail } from '../tip_detail';
import { AaveViewProposalDetail } from './aave_summary';
import type { LinkedSubstrateProposal } from './linked_proposals_embed';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import type { SubheaderProposalType } from './proposal_components';
import { ProposalSubheader } from './proposal_components';

type ProposalPrefetch = {
  [identifier: string]: {
    profilesFinished: boolean;
    profilesStarted: boolean;
  };
};

type ViewProposalPageAttrs = {
  identifier: string;
  type?: string;
};

class ViewProposalPage extends ClassComponent<ViewProposalPageAttrs> {
  private prefetch: ProposalPrefetch;
  private proposal: AnyProposal;
  private tipAmount: number;
  private votingModalOpen: boolean;

  view(vnode: m.Vnode<ViewProposalPageAttrs>) {
    const { identifier } = vnode.attrs;

    if (!app.chain?.meta) {
      return (
        <PageLoading
        // title="Loading..."
        />
      );
    }

    const type = vnode.attrs.type || chainToProposalSlug(app.chain.meta);

    const headerTitle = 'Proposals';

    if (typeof identifier !== 'string')
      return (
        <PageNotFound
        // title={headerTitle}
        />
      );

    const proposalId = identifier.split('-')[0];
    const proposalType = type;
    const proposalIdAndType = `${proposalId}-${proposalType}`;

    // we will want to prefetch profiles, and viewCount on the page before rendering anything
    if (!this.prefetch || !this.prefetch[proposalIdAndType]) {
      this.prefetch = {};

      this.prefetch[proposalIdAndType] = {
        profilesFinished: false,
        profilesStarted: false,
      };
    }

    if (
      this.proposal &&
      (+this.proposal.identifier !== +proposalId ||
        this.proposal.slug !== proposalType)
    ) {
      this.proposal = undefined;
    }

    // load proposal, and return <PageLoading />
    if (!this.proposal) {
      try {
        this.proposal = idToProposal(proposalType, proposalId);
      } catch (e) {
        if (!app.chain.loaded) {
          return (
            <PageLoading
            //  title={headerTitle}
            />
          );
        }

        // check if module is still initializing
        const c = proposalSlugToClass().get(proposalType) as ProposalModule<
          any,
          any,
          any
        >;

        if (!c) {
          return <PageNotFound message="Invalid proposal type" />;
        }

        if (!c.ready) {
          // TODO: perhaps we should be able to load here without fetching ALL proposal data
          // load sibling modules too
          if (app.chain.base === ChainBase.Substrate) {
            const chain = app.chain as Substrate;

            app.chain.loadModules([
              chain.treasury,
              chain.democracyProposals,
              chain.democracy,
              chain.tips,
            ]);
          } else {
            app.chain.loadModules([c]);
          }

          return (
            <PageLoading
            // title={headerTitle}
            />
          );
        }
        // proposal does not exist, 404
        return <PageNotFound message="Proposal not found" />;
      }
    }

    if (identifier !== `${proposalId}-${slugify(this.proposal.title)}`) {
      navigateToSubpage(
        getProposalUrlPath(
          this.proposal.slug,
          `${proposalId}-${slugify(this.proposal.title)}`,
          true
        ),
        {},
        { replace: true }
      );
    }

    // load profiles
    if (this.prefetch[proposalIdAndType]['profilesStarted'] === undefined) {
      if (this.proposal.author instanceof Account) {
        // AnyProposal
        app.newProfiles.getProfile(
          this.proposal.author.chain.id,
          this.proposal.author.address
        );
      }

      this.prefetch[proposalIdAndType]['profilesStarted'] = true;
    }

    if (
      !app.newProfiles.allLoaded() &&
      !this.prefetch[proposalIdAndType]['profilesFinished']
    ) {
      return (
        <PageLoading
        //  title={headerTitle}
        />
      );
    }

    this.prefetch[proposalIdAndType]['profilesFinished'] = true;

    if (this.proposal instanceof SubstrateTreasuryTip) {
      return (
        <TipDetail
          tipAmount={this.tipAmount}
          proposal={this.proposal}
          headerTitle={headerTitle}
          setTipAmount={(tip) => {
            this.tipAmount = tip;
          }}
        />
      );
    }

    const toggleVotingModal = (newModalState: boolean) => {
      this.votingModalOpen = newModalState;
      m.redraw();
    };

    const onModalClose = () => {
      this.votingModalOpen = false;
      m.redraw();
    };

    return (
      <Sublayout
      //  title={headerTitle}
      >
        <CWContentPage
          title={this.proposal.title}
          author={
            !!this.proposal.author &&
            m(User, {
              avatarSize: 24,
              user: this.proposal.author,
              popover: true,
              linkify: true,
            })
          }
          createdAt={this.proposal.createdAt}
          subHeader={
            <ProposalSubheader
              proposal={this.proposal as SubheaderProposalType}
              toggleVotingModal={toggleVotingModal}
              votingModalOpen={this.votingModalOpen}
            />
          }
          body={
            !!this.proposal.description && (
              <CollapsibleProposalBody proposal={this.proposal} />
            )
          }
          subBody={
            <>
              <LinkedProposalsEmbed
                proposal={this.proposal as LinkedSubstrateProposal}
              />
              {this.proposal instanceof AaveProposal && (
                <AaveViewProposalDetail proposal={this.proposal} />
              )}
              <VotingResults proposal={this.proposal} />
              <VotingActions
                onModalClose={onModalClose}
                proposal={this.proposal}
                toggleVotingModal={toggleVotingModal}
                votingModalOpen={this.votingModalOpen}
              />
            </>
          }
        />
      </Sublayout>
    );
  }
}

export default ViewProposalPage;
