/* @jsx m */
import m from 'mithril';
import Sublayout from '../../sublayout';
import DelegateCard from './delegate_card';
import 'pages/delegation/index.scss';
import app from 'state';
import { Account, AddressInfo, Profile } from 'client/scripts/models';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  CWTable,
  TableEntry,
  TableEntryType,
} from '../../components/component_kit/cw_table';
import User from '../../components/widgets/user';
import numeral from 'numeral';
import _ from 'lodash';

type DelegationPageAttrs = { topic?: string };

export type DelegateInfo = {
  delegate: Account<any> | AddressInfo | Profile;
  delegateAddress: string;
  delegateName: string;
  voteWeight: number;
  totalVotes: number;
  proposals: number;
  rank: number;
  recentProposal: {
    proposalText: string;
    outcome: boolean; // true if they voted with majority?
    proposalLink: string; // url of the proposal on CW
  };
};

function buildTableData(
  delegates: Array<DelegateInfo>,
  currentDelegate: DelegateInfo,
  keywordFragment: string,
  updateSelectedDelegate: (
    delegate: DelegateInfo | null,
    action: string
  ) => Promise<void>
): Array<Array<TableEntry>> {
  let result = [];
  for (const delegateInfo of delegates) {
    const {
      delegate,
      delegateAddress,
      delegateName,
      totalVotes,
      voteWeight,
      proposals,
      rank,
      recentProposal,
    } = delegateInfo;

    const isSelectedDelegate = _.isEqual(delegateInfo, currentDelegate);

    let currentRow = [
      {
        value: rank,
        type: TableEntryType.String,
      },
      {
        value: (
          <div class="delegate-avatar-section">
            {m(User, {
              user: delegate,
              avatarSize: 25,
              popover: true,
              avatarOnly: true,
            })}
            <div class="avatar-name">{delegateName}</div>
          </div>
        ),
        type: TableEntryType.Component,
      },
      {
        value: numeral(voteWeight).format('0.0%'),
        type: TableEntryType.String,
        align: 'right',
      },
      {
        value: numeral(totalVotes).format('0 a'),
        type: TableEntryType.String,
        align: 'right',
      },
      { value: proposals, type: TableEntryType.String, align: 'right' },
      {
        value: isSelectedDelegate ? 'Selected' : 'Delegate',
        type: TableEntryType.Button,
        buttonDetails: {
          onclick: () => {
            if (!isSelectedDelegate) {
              updateSelectedDelegate(delegateInfo, 'update');
              m.redraw();
            }
          },
          buttonType: isSelectedDelegate ? 'primary' : 'secondary',
        },
        align: 'right',
      },
    ];

    if (keywordFragment === '') {
      result.push(currentRow);
    } else {
      const keyLength = keywordFragment.length;
      const upperKeyword = keywordFragment.toUpperCase();
      if (
        delegateName.slice(0, keyLength).toUpperCase() === upperKeyword ||
        delegateAddress.slice(0, keyLength).toUpperCase() === upperKeyword
      ) {
        result.push(currentRow);
      }
    }
  }

  return result;
}

class DelegationPage implements m.ClassComponent<DelegationPageAttrs> {
  private delegate: DelegateInfo;
  private delegates: Array<DelegateInfo>;
  private filteredDelegateInfo: Array<Array<TableEntry>>;
  private tableRendered: boolean;
  oninit(vnode) {
    // TODO: Replace below with processDelegates() call

    // Load Delegates
    const dummyData: Array<DelegateInfo> = [
      {
        delegate: app.user.activeAccount,
        delegateAddress: '0xasdsasd24ewrqwsdanf',
        delegateName: 'Alex Young',
        voteWeight: 0.129,
        totalVotes: 100,
        proposals: 4,
        rank: 1,
        recentProposal: {
          proposalText: 'A proposal 1',
          outcome: true,
          proposalLink: '...',
        },
      },
      {
        delegate: app.user.activeAccount,
        delegateAddress: '0x1234asdf14sdfa',
        delegateName: 'Other Guy',
        voteWeight: 0.129,
        totalVotes: 100,
        proposals: 4,
        rank: 2,
        recentProposal: {
          proposalText: 'A proposal 1',
          outcome: true,
          proposalLink: '...',
        },
      },
      {
        delegate: app.user.activeAccount,
        delegateAddress: '0xas34asdf14sdfa',
        delegateName: 'Zak',
        voteWeight: 0.1,
        totalVotes: 40,
        proposals: 4,
        rank: 3,
        recentProposal: {
          proposalText: 'A proposal 1',
          outcome: true,
          proposalLink: '...',
        },
      },
      {
        delegate: app.user.activeAccount,
        delegateAddress: '0x1234asdf14sdfa',
        delegateName: 'Jason',
        voteWeight: 0.029,
        totalVotes: 50,
        proposals: 10,
        rank: 4,
        recentProposal: {
          proposalText: 'A proposal 1',
          outcome: true,
          proposalLink: '...',
        },
      },
      {
        delegate: app.user.activeAccount,
        delegateAddress: '0x1234asdf14sdfa',
        delegateName: 'Alex2 Young2',
        voteWeight: 0.003,
        totalVotes: 50,
        proposals: 10,
        rank: 5,
        recentProposal: {
          proposalText: 'A proposal 1',
          outcome: true,
          proposalLink: '...',
        },
      },
    ]; // TODO: Replace with fetch of all the delegates
    this.delegates = [];

    // TODO: remove this duplicate data that was used for testing
    for (let i = 0; i < 5; i++) {
      this.delegates = this.delegates.concat(dummyData);
    }

    // Load Selected Delegate
    this.delegate = {
      delegate: app.user.activeAccount,
      delegateAddress: '0xasdsasd24ewrqwsdanf',
      delegateName: 'Alex Young',
      voteWeight: 0.129,
      totalVotes: 100,
      proposals: 4,
      rank: 1,
      recentProposal: {
        proposalText: 'A proposal 1',
        outcome: true,
        proposalLink: '...',
      },
    }; // TODO: Replace this with an actual fetch of the user's selected delegate. Include handling for if none exists
  }
  view(vnode) {
    const updateSelectedDelegate = async (
      delegate: DelegateInfo,
      action: string
    ) => {
      if (action === 'update') {
        this.delegate = delegate;
        // TODO: Call the controllers with setDelegate()
      } else if (action === 'remove') {
        this.delegate = null;
        // TODO: Call the controllers with removeDelegate()
      }
      this.tableRendered = false;
      m.redraw();
    };

    // Handle Search Bar
    const updateFilter = (value: string) => {
      this.filteredDelegateInfo = buildTableData(
        this.delegates,
        this.delegate,
        value,
        updateSelectedDelegate
      );
      m.redraw();
    };

    if (!this.tableRendered) {
      this.filteredDelegateInfo = buildTableData(
        this.delegates,
        this.delegate,
        '',
        updateSelectedDelegate
      );
      this.tableRendered = true;
    }

    return (
      <Sublayout class="DelegationPage" title="Delegation">
        <div class="top-section">
          {this.delegate ? (
            <div class="wrapper">
              <div class="header">Delegates</div>
              <div class="subheader">Your Delegate</div>
              {
                // TODO: Include Info Icon when accessible
              }
              <DelegateCard
                delegateInfo={this.delegate}
                updateDelegate={updateSelectedDelegate}
              />
            </div>
          ) : (
            <div class="wrapper">
              <div class="delegate-missing-header">Choose a delegate</div>
              <div class="info-text">
                It's tough to keep up with DAO governance. Find a delegate that
                you trust and delegate your voting power to them. 👇👇👇
              </div>
            </div>
          )}
        </div>
        <div class="bottom-section">
          <div class="wrapper">
            <div class="subheader">Leaderboard</div>
            <div class="search-wrapper">
              <CWTextInput
                name="Form field"
                oninput={(e) => {
                  updateFilter((e.target as any).value);
                }}
                placeholder="Search Delegates"
              />
            </div>

            <CWTable
              columns={[
                { colTitle: 'Rank', colWidth: '7%', collapse: false },
                { colTitle: 'Delegate', colWidth: '25%', collapse: false },
                {
                  colTitle: 'Vote Weight',
                  colWidth: '15%',
                  align: 'right',
                  collapse: false,
                },
                {
                  colTitle: 'Total Votes',
                  colWidth: '15%',
                  align: 'right',
                  collapse: true,
                },
                {
                  colTitle: 'Proposals',
                  colWidth: '15%',
                  align: 'right',
                  collapse: true,
                },
                { colTitle: '', align: 'right', collapse: false },
              ]}
              data={this.filteredDelegateInfo}
            />
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default DelegationPage;
