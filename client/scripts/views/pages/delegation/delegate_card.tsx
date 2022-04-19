/* @jsx m */

import m from 'mithril';
import { Spinner } from 'construct-ui';
import numeral from 'numeral';

import 'pages/delegation/delegate_card.scss';
import { notifySuccess } from 'controllers/app/notifications';
import { Profile } from 'client/scripts/models';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWButton } from '../../components/component_kit/cw_button';
import User from '../../components/widgets/user';
import { DelegateInfo } from '.';

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

type DelegateCardAttrs = {
  delegateInfo: DelegateInfo;
  updateDelegate: (
    delegate: DelegateInfo | null,
    action: string
  ) => Promise<void>;
};

class DelegateCard implements m.ClassComponent<DelegateCardAttrs> {
  view(vnode) {
    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="delegate-card"
      >
        <div class="card-body">
          <div class="top-section">
            <div class="top-left">
              {vnode.attrs.delegateInfo &&
                m(User, {
                  user: vnode.attrs.delegateInfo.delegate,
                  avatarOnly: true,
                  avatarSize: 40,
                  popover: true,
                })}
              <div class="profile-section">
                <div class="profile-name">
                  {(vnode.attrs.delegateInfo.delegate as Profile)?.name}
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
                    {(
                      vnode.attrs.delegateInfo.delegate as Profile
                    )?.address.slice(0, 5) +
                      '...' +
                      (
                        vnode.attrs.delegateInfo.delegate as Profile
                      )?.address.slice(
                        (vnode.attrs.delegateInfo.delegate as Profile)?.address
                          .length - 5
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
                  displayValue={numeral(
                    vnode.attrs.delegateInfo.voteWeight
                  ).format('0.0%')}
                  persist={true}
                  dataFetched={vnode.attrs.delegateInfo}
                />
                <StatSection
                  title="Total Votes"
                  displayValue={numeral(
                    vnode.attrs.delegateInfo.totalVotes
                  ).format('0 a')}
                  secondaryCount="158"
                  persist={false}
                  dataFetched={vnode.attrs.delegateInfo}
                />
                <StatSection
                  title="Proposal Votes"
                  displayValue={vnode.attrs.delegateInfo.proposals.toString()}
                  persist={false}
                  dataFetched={vnode.attrs.delegateInfo}
                />
              </div>
              <CWButton
                label="Remove"
                onclick={() => vnode.attrs.updateDelegate(null, 'remove')}
                buttonType="secondary"
              />
            </div>
          </div>
          <div class="bottom-section">
            <div class="latest">Latest Proposal: </div>
            <div class="recent-proposal-text">
              {vnode.attrs.delegateInfo.recentProposal.proposalText}
            </div>
            {
              // TODO: Insert arrow icon here when its implemented
            }
            <div class="voted">Voted: </div>
            <div
              class={
                vnode.attrs.delegateInfo.recentProposal.outcome
                  ? 'passed'
                  : 'not-passed'
              }
            >
              {vnode.attrs.delegateInfo.recentProposal.outcome
                ? 'PASSED'
                : 'NOT PASSED'}
            </div>
          </div>
        </div>
      </CWCard>
    );
  }
}

export default DelegateCard;
