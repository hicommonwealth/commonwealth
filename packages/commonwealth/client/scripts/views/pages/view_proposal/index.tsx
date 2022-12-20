/* @jsx m */

import m from 'mithril';
import { ClassComponent } from 'mithrilInterop';

import app from 'state';
import { navigateToSubpage } from 'app';
import Sublayout from 'views/sublayout';
import { ChainBase } from 'common-common/src/types';
import {
  chainToProposalSlug,
  getProposalUrlPath,
  idToProposal,
  proposalSlugToClass,
} from 'identifiers';
import { slugify } from 'utils';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import Substrate from 'controllers/chain/substrate/adapter';
import { notifyError } from 'controllers/app/notifications';
import { Comment, Account, ProposalModule, AnyProposal } from 'models';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { TipDetail } from '../tip_detail';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import User from '../../components/widgets/user';
import {
  ProposalSubheader,
  SubheaderProposalType,
} from './proposal_components';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { AaveViewProposalDetail } from './aave_summary';
import {
  LinkedProposalsEmbed,
  LinkedSubstrateProposal,
} from './linked_proposals_embed';
import { CommentsTree } from '../../components/comments/comments_tree';
import {
  CollapsibleProposalBody,
  CollapsibleThreadBody,
} from '../../components/collapsible_body_text';

type ProposalPrefetch = {
  [identifier: string]: {
    commentsStarted: boolean;
    profilesFinished: boolean;
    profilesStarted: boolean;
  };
};

type ViewProposalPageAttrs = {
  identifier: string;
  type?: string;
};

class ViewProposalPage extends ClassComponent<ViewProposalPageAttrs> {
  private comments: Comment<AnyProposal>[];
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

    // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
    if (!this.prefetch || !this.prefetch[proposalIdAndType]) {
      this.prefetch = {};

      this.prefetch[proposalIdAndType] = {
        commentsStarted: false,
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
              chain.council,
              chain.technicalCommittee,
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

    // load comments
    if (!this.prefetch[proposalIdAndType]['commentsStarted']) {
      app.comments
        .refresh(this.proposal, app.activeChainId())
        .then(async () => {
          this.comments = app.comments
            .getByProposal(this.proposal)
            .filter((c) => c.parentComment === null);

          m.redraw();
        })
        .catch(() => {
          notifyError('Failed to load comments');
          this.comments = [];
          m.redraw();
        });

      this.prefetch[proposalIdAndType]['commentsStarted'] = true;
    }

    if (this.comments?.length) {
      const mismatchedComments = this.comments.filter((c) => {
        return c.rootProposal !== `${type}_${proposalId}`;
      });

      if (mismatchedComments.length) {
        this.prefetch[proposalIdAndType]['commentsStarted'] = false;
      }
    }

    const updatedCommentsCallback = () => {
      this.comments = app.comments
        .getByProposal(this.proposal)
        .filter((c) => c.parentComment === null);
      m.redraw();
    };

    if (this.comments === undefined) {
      return (
        <PageLoading
        //  title={headerTitle}
        />
      );
    }

    // load profiles
    if (this.prefetch[proposalIdAndType]['profilesStarted'] === undefined) {
      if (this.proposal.author instanceof Account) {
        // AnyProposal
        app.profiles.getProfile(
          this.proposal.author.chain.id,
          this.proposal.author.address
        );
      }

      this.comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });

      this.prefetch[proposalIdAndType]['profilesStarted'] = true;
    }

    if (
      !app.profiles.allLoaded() &&
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
          comments={
            <CommentsTree
              comments={this.comments}
              proposal={this.proposal}
              updatedCommentsCallback={updatedCommentsCallback}
            />
          }
        />
      </Sublayout>
    );
  }
}

export default ViewProposalPage;
