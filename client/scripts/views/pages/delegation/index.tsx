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
import getDelegationData, { GovernanceStandard } from 'server/routes/getDelegationData';
import ProfilesController from '../../../controllers/server/profiles';
import numeral from 'numeral';
import { chain } from 'lodash';
import { ChainNetwork } from 'shared/types';

type DelegationPageAttrs = { topic?: string };

type DelegateInfo = {
  delegate: Account<any> | AddressInfo | Profile;
  delegateAddress: string;
  delegateName: string;
  voteWeight: number;
  totalVotes: number;
  proposals: number;
  rank: number;
};


async function processDelegates(): Promise<[DelegateInfo, DelegateInfo[]]>{

  // determine which governance standard being used by this community
  let standard : GovernanceStandard;
  if(app.chain.network === ChainNetwork.Aave) {
    standard = GovernanceStandard.Aave;
  }
  else if(app.chain.network === ChainNetwork.Compound) {
    standard = GovernanceStandard.Compound;
  }
  else {
    standard = GovernanceStandard.ERC20Votes;
  }

  const delegationEvents = $.get(`${app.serverUrl()}/getDelegationData`, {
    delegation_standard: standard,
    chain: app.chain
  });

  // Specifies number of votes per delegate
  let delegateWeighting: Map<string, number> = new Map();

  // Specifies which address each user is delegating votes to
  let delegateMap: Map<string, string> = new Map();

  // TODO extract data from other events
  let totalVotesCast = 0;
  for(const event in delegationEvents) {
    if(true) {
      const eventType = event.chain_event_type_id;
      const eventData = event.event_data;

      switch(standard) {
        case GovernanceStandard.ERC20Votes:
          switch(eventType) {
            case "delegate-votes-changed":
              delegateWeighting[eventData.delegate] = eventData.newBalance;
              totalVotesCast += (eventData.newBalance - eventData.oldBalance);
              break;
            case "delegate-changed":
              break;
          }
          break;
        case GovernanceStandard.Compound:
          switch(eventType) {
            case "proposal-created":
              break;
            case "vote-cast":
              // delegateWeighting[eventData.eventData.votes] = 
              break;
            case "proposal-canceled":
              break;
            case "proposal-queued":
              break;
            case "proposal-executed":
              break;
            case "delegated-power-changed":
              break;
          }
          break;
        case GovernanceStandard.Aave:
          switch(eventType) {
            case "vote-emitted":
              break;
            case "proposal-created":
              break;
            case "proposal-queued":
              break;
            case "delegate-changed":
              break;
            case "delegated-power-changed":
              break;
          }
          break;
      }
  }

  const prof : ProfilesController = new ProfilesController();

  // rank-order addresses by total votes:
  const rankOrderedMap = new Map([...delegateWeighting.entries()].sort((a,b)=>b[1]-a[1]));
  var allDelegates : DelegateInfo[];

  var delegateOfUser : DelegateInfo = null;

  // Once this table is built (and rank-ordered), create DelegateInfo cards
  var rank = 1;
  for(let address of delegateWeighting.keys()) {
    var delegateAddress = address;
    var delegate : Profile = prof.getProfile(chain.name, delegateAddress);
    var delegateName : string = delegate.name;
    var totalVotes = delegateWeighting[address];
    var voteWeight = parseFloat((totalVotes / totalVotesCast).toFixed(2)); 
    //TODO fix proposals
    var proposals = 0;

    // push current delegate information
    var newDelegateInfo : DelegateInfo = {delegate, delegateAddress, delegateName, voteWeight, totalVotes, proposals, rank};
    allDelegates.push(newDelegateInfo);

    // check to see if our user has delegated to this particular address.
    if(delegateMap[app.user.activeAccount.address] == address) {
      delegateOfUser = newDelegateInfo;
    }
    rank += 1
  }
  return [delegateOfUser, allDelegates]
}

function buildTableData(
  delegates: Array<DelegateInfo>,
  keywordFragment: string
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
    } = delegateInfo;

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
        value: 'Delegate',
        type: TableEntryType.Button,
        buttonDetails: {
          onclick: () => console.log('clicked!'), // TODO: Replace with controller delegate() call
          buttonType: 'secondary',
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
  private delegate: Account<any> | AddressInfo | Profile;
  private delegates: Array<DelegateInfo>;
  private filteredDelegateInfo: Array<Array<TableEntry>>;
  view(vnode) {
    if (!this.delegate) {
      this.delegate = app.user.activeAccount; // TODO: Replace this with an actual fetch of the user's selected delegate. Include handling for if none exists
      m.redraw();
    }

    if (!this.delegates) {
      const dummyData: Array<DelegateInfo> = [
        {
          delegate: app.user.activeAccount,
          delegateAddress: '0xasdsasd24ewrqwsdanf',
          delegateName: 'Alex Young',
          voteWeight: 0.129,
          totalVotes: 100,
          proposals: 4,
          rank: 1, // TODO: Determine if the sorting happens in the route or here. If not here, then we need to sort and add this rank value
        },
        {
          delegate: app.user.activeAccount,
          delegateAddress: '0x1234asdf14sdfa',
          delegateName: 'Other Guy',
          voteWeight: 0.129,
          totalVotes: 100,
          proposals: 4,
          rank: 2,
        },
        {
          delegate: app.user.activeAccount,
          delegateAddress: '0xas34asdf14sdfa',
          delegateName: 'Zak',
          voteWeight: 0.1,
          totalVotes: 40,
          proposals: 4,
          rank: 3,
        },
        {
          delegate: app.user.activeAccount,
          delegateAddress: '0x1234asdf14sdfa',
          delegateName: 'Jason',
          voteWeight: 0.029,
          totalVotes: 50,
          proposals: 10,
          rank: 4,
        },
        {
          delegate: app.user.activeAccount,
          delegateAddress: '0x1234asdf14sdfa',
          delegateName: 'Alex2 Young2',
          voteWeight: 0.003,
          totalVotes: 50,
          proposals: 10,
          rank: 5,
        },
      ]; // TODO: Replace with fetch of all the delegates
      this.delegates = [];

      // TODO: remove this duplicate data that was used for testing
      for (let i = 0; i < 5; i++) {
        this.delegates = this.delegates.concat(dummyData);
      }

      this.filteredDelegateInfo = buildTableData(this.delegates, '');
      m.redraw();
    }

    const updateFilter = (value: string) => {
      this.filteredDelegateInfo = buildTableData(this.delegates, value);
      m.redraw();
    };

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
              <DelegateCard delegate={this.delegate} />
            </div>
          ) : (
            <div class="delegate-card-wrapper">
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
