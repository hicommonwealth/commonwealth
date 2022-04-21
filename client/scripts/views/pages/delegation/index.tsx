/* @jsx m */

import m from 'mithril';
import numeral from 'numeral';
import _ from 'lodash';

import 'pages/delegation/index.scss';

import { Account, AddressInfo, Profile } from 'models';
import app from 'state';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  CWTable,
  TableEntry,
  TableEntryType,
} from '../../components/component_kit/cw_table';
import User from '../../components/widgets/user';
import getDelegationData, { GovernanceStandard } from 'server/routes/getDelegationData';
import ProfilesController from '../../../controllers/server/profiles';
import { chain } from 'lodash';
import { ChainNetwork } from 'shared/types';
import CompoundChain from 'client/scripts/controllers/chain/ethereum/compound/chain';
import AaveChain from 'client/scripts/controllers/chain/ethereum/aave/chain';
import DelegateCard from './delegate_card';
import Sublayout from '../../sublayout';
import { ViewController } from '@magic-sdk/provider';

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

  const response = await $.get(`${app.serverUrl()}/getDelegationData`, {
    delegation_standard: standard,
    chain: app.chain
  });
  if (response.status !== 'Success') {
    throw new Error(`Cannot fetch events: ${response.status}`);
  }



  // Specifies number of votes per delegate
  let delegateWeighting: Map<string, number> = new Map();

  // Specifies which address each user is delegating votes to
  let delegateMap: Map<string, string> = new Map();

  // TODO extract data from other events
  let totalVotesCast = 0;


  response.result.map((rawEvent) => {
    const {
      chain_event_type_id,
      event_data,
    } = rawEvent;
    // some simple string manipulation likely needs to be done here for the chain_event_type_id.
    const eventType = chain_event_type_id;
    const eventData = event_data;

    switch(standard) {
      case GovernanceStandard.ERC20Votes:
        switch(eventType) {
          case "delegate-votes-changed":
            delegateWeighting[eventData.delegate] = eventData.newBalance;
            totalVotesCast += (eventData.newBalance - eventData.oldBalance);
            break;
          case "delegate-changed":
            break;
          default:
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
          default:
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
          default:
            break;
        }
        break;
      default:
        break;
    }
    // return is useless, since this isn't used again.
    return rawEvent;
  });

  const prof : ProfilesController = new ProfilesController();

  // rank-order addresses by total votes:
  const rankOrderedMap = new Map([...delegateWeighting.entries()].sort((a,b)=>b[1]-a[1]));
  let allDelegates : DelegateInfo[];

  let delegateOfUser : DelegateInfo = null;

  // Once this table is built (and rank-ordered), create DelegateInfo cards
  let rank = 1;
  for(let address of delegateWeighting.keys()) {
    let delegateAddress = address;
    let delegate : Profile = prof.getProfile(chain.name, delegateAddress);
    let delegateName : string = delegate.name;
    let totalVotes = delegateWeighting[address];
    let voteWeight = parseFloat((totalVotes / totalVotesCast).toFixed(2)); 
    // TODO fix proposals
    let proposals = 0;

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
  currentDelegate: DelegateInfo,
  keywordFragment: string,
  updateSelectedDelegate: (
    delegate: DelegateInfo | null,
    action: string
  ) => Promise<void>
): Array<Array<TableEntry>> {
  const result = [];

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

    let controller;

    if(standard == GovernanceStandard.Aave) {
      controller = new AaveChain(app);
    }
    else {
      controller = new CompoundChain(app);
    }
    controller.init(app.chain.meta);

    const isSelectedDelegate = _.isEqual(delegateInfo, currentDelegate);

    const currentRow = [
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
  oninit() {
    // TODO: Replace below with processDelegates() call
    [this.delegate, this.delegates] = processDelegates();
  }
  view() {
    const updateSelectedDelegate = async (
      delegate: DelegateInfo,
      action: string
    ) => {
      if (action === 'update') {
        this.delegate = delegate;
        // TODO: Call the controllers with setDelegate()
        controller.setDelegate(delegate.delegateAddress);
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
      <Sublayout title="Delegation">
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