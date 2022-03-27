/* @jsx m */
import m from 'mithril';
import { CWCard } from '../../components/component_kit/cw_card';
import 'pages/delegation/delegate_card.scss';
import { CWButton } from '../../components/component_kit/cw_button';
import { Spinner } from 'construct-ui';
import User from '../../components/widgets/user';
import app from 'state';
import { notifySuccess } from 'controllers/app/notifications';
import { Account, AddressInfo, Profile } from 'client/scripts/models';
import numeral from 'numeral';

type DelegateCardAttrs = {
  delegate: Account<any> | AddressInfo | Profile; // This is fetched in the parent component because DelegateCard siblings may find it useful
};

type delegateInto = {
  voteWeight: number;
  totalVotes: number;
  proposals: number;
  latestProposal: {
    proposalTitle: String;
    proposalVoteOutcome: boolean; // This might need to be an enum if we have options beyond "pass" and "not pass"
  };
};

const delegateInfoMockData = {
  voteWeight: 0.129,
  totalVotes: 330000000,
  proposals: 11,
  latestProposal: {
    proposalTitle: 'Governance Proposal to Set Maximum per Block Gas',
    proposalVoteOutcome: true,
  },
};
class DelegateCard implements m.ClassComponent<DelegateCardAttrs> {
  private fetchedDelegateInfo: boolean;
  private delegateInfo: any;
  // TODO: define the shape of this object that gets returned from the route. Currently using a temporary (potentially permanent)
  // object shape. delegateInfo needs to store the Vote Weight, Total Votes, Proposals, Recent Proposal Vote
  // (and a reference to the outcome)
  oninit(vnode) {
    this.fetchedDelegateInfo = false;
  }
  view(vnode) {
    if (!this.fetchedDelegateInfo) {
      // TODO: Fetch here to update the fetchedDelegateInfo
      this.delegateInfo = delegateInfoMockData;
      this.fetchedDelegateInfo = true;
      m.redraw();
    }
    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="delegate-card"
      >
        <div class="card-body">
          <div class="top-section">
            <div class="top-left">
              {vnode.attrs.delegate &&
                m(User, {
                  user: vnode.attrs.delegate,
                  avatarOnly: true,
                  avatarSize: 40,
                })}
              <div class="profile-section">
                <div class="profile-name">
                  {(vnode.attrs.delegate as Profile)?.name}
                  {
                    // This is not quite working rn ^
                  }
                </div>
                <div
                  class="address-section"
                  onclick={() => {
                    window.navigator.clipboard
                      .writeText('text')
                      .then(() => notifySuccess('Copied address to clipboard'));
                  }}
                >
                  <div class="address">
                    {(vnode.attrs.delegate as Profile)?.address.slice(0, 5) +
                      '...' +
                      (vnode.attrs.delegate as Profile)?.address.slice(
                        (vnode.attrs.delegate as Profile)?.address.length - 5
                      )}
                  </div>
                  <img
                    class="copy-icon"
                    src="/static/img/copy_default.svg"
                  ></img>
                </div>
              </div>
            </div>
            <div class="top-right">
              <div class="stats-group">
                <StatSection
                  title="Vote Weight"
                  displayValue={numeral(this.delegateInfo.voteWeight).format(
                    '0.0%'
                  )}
                  persist={true}
                  dataFetched={this.fetchedDelegateInfo}
                />
                <StatSection
                  title="Total Votes"
                  displayValue={numeral(this.delegateInfo.totalVotes).format(
                    '0 a'
                  )}
                  secondaryCount="158"
                  persist={false}
                  dataFetched={this.fetchedDelegateInfo}
                />
                <StatSection
                  title="Proposals"
                  displayValue={this.delegateInfo.proposals.toString()}
                  persist={false}
                  dataFetched={this.fetchedDelegateInfo}
                />
              </div>
              <CWButton
                label="Remove"
                onclick={() => {
                  console.log('would be removing the delegate here!');
                  // TODO: make a call to the remove delegate function on Jasons controller; resolve UI implications
                }}
                buttonType="secondary"
              />
            </div>
          </div>
          <div class="bottom-section">
            <div class="latest">Latest Proposal: </div>
            <div class="recent-proposal-text">
              {this.delegateInfo.latestProposal.proposalTitle}
            </div>
            {
              // TODO: Insert arrow icon here when its implemented
            }
            <div class="voted">Voted: </div>
            <div
              class={
                this.delegateInfo.latestProposal.proposalVoteOutcome
                  ? 'passed'
                  : 'not-passed'
              }
            >
              {this.delegateInfo.latestProposal.proposalVoteOutcome
                ? 'PASSED'
                : 'NOT PASSED'}
            </div>
          </div>
        </div>
      </CWCard>
    );
  }
}

type StatSectionAttrs = {
  title: string;
  displayValue: string;
  secondaryCount?: string;
  persist: boolean;
  dataFetched: boolean;
};
class StatSection implements m.ClassComponent<StatSectionAttrs> {
  view(vnode) {
    return (
      <div class={`stat-section${!vnode.attrs.persist ? '-hidden' : ''}`}>
        <div class="title">
          <div>{vnode.attrs.title}</div>

          {vnode.attrs.secondaryCount && (
            <div class="secondary-count">{vnode.attrs.secondaryCount}</div>
          )}
        </div>
        {vnode.attrs.dataFetched ? (
          <div class="display-value">{vnode.attrs.displayValue}</div>
        ) : (
          <div style={'margin-left: 30px'}>
            <Spinner active={true} size="xs" />
          </div>
        )}
      </div>
    );
  }
}

export default DelegateCard;
