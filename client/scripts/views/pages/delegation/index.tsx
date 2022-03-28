/* @jsx m */
import m from 'mithril';
import Sublayout from '../../sublayout';
import DelegateCard from './delegate_card';
import 'pages/delegation/index.scss';
import app from 'state';
import { Account, AddressInfo, Profile } from 'client/scripts/models';
import {
  CWTextInput,
  ValidationStatus,
} from '../../components/component_kit/cw_text_input';
import {
  CWTable,
  TableEntryType,
} from '../../components/component_kit/cw_table';
import User from '../../components/widgets/user';

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

class DelegationPage implements m.ClassComponent<DelegationPageAttrs> {
  private delegate: Account<any> | AddressInfo | Profile;
  private delegates: Array<DelegateInfo>;
  view(vnode) {
    // ----------------- MOCK DATA -------------- //
    const dummyTableData = {
      columns: [
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
      ],
      data: [
        [
          {
            value: 1,
            type: TableEntryType.String,
          },
          {
            value: (
              <div class="delegate-avatar-section">
                {m(User, {
                  user: app.user.activeAccount,
                  avatarSize: 25,
                  popover: true,
                  avatarOnly: true,
                })}
                <div class="avatar-name">{'Alex Young'}</div>
              </div>
            ),
            type: TableEntryType.Component,
          },
          { value: '12.9%', type: TableEntryType.String, align: 'right' },
          { value: '330 M', type: TableEntryType.String, align: 'right' },
          { value: '11', type: TableEntryType.String, align: 'right' },
          {
            value: 'Delegate',
            type: TableEntryType.Button,
            buttonDetails: {
              onclick: () => console.log('clicked!'),
              buttonType: 'secondary',
            },
            align: 'right',
          },
        ],
        [
          {
            value: 2,
            type: TableEntryType.String,
          },
          {
            value: (
              <div class="delegate-avatar-section">
                {m(User, {
                  user: app.user.activeAccount,
                  avatarSize: 25,
                  popover: true,
                  avatarOnly: true,
                })}
                <div class="avatar-name">{'Other Dude'}</div>
              </div>
            ),
            type: TableEntryType.Component,
          },
          { value: '11.9%', type: TableEntryType.String, align: 'right' },
          { value: '310 M', type: TableEntryType.String, align: 'right' },
          { value: '23', type: TableEntryType.String, align: 'right' },
          {
            value: 'Delegate',
            type: TableEntryType.Button,
            buttonDetails: {
              onclick: () => console.log('clicked!'),
              buttonType: 'secondary',
            },
            align: 'right',
          },
        ],
        [
          {
            value: 3,
            type: TableEntryType.String,
          },
          {
            value: (
              <div class="delegate-avatar-section">
                {m(User, {
                  user: app.user.activeAccount,
                  avatarSize: 25,
                  popover: true,
                  avatarOnly: true,
                })}
                <div class="avatar-name">{'Zak Hap'}</div>
              </div>
            ),
            type: TableEntryType.Component,
          },
          { value: '3.9%', type: TableEntryType.String, align: 'right' },
          { value: '37 M', type: TableEntryType.String, align: 'right' },
          { value: '220', type: TableEntryType.String, align: 'right' },
          {
            value: 'Delegate',
            type: TableEntryType.Button,
            buttonDetails: {
              onclick: () => console.log('clicked!'),
              buttonType: 'secondary',
            },
            align: 'right',
          },
        ],
      ],
    };

    // ----------------- END MOCK DATA -------------- //

    if (!this.delegate) {
      this.delegate = app.user.activeAccount; // TODO: Replace this with an actual fetch of the user's selected delegate. Include handling for if none exists
      m.redraw();
    }

    if (!this.delegates) {
      this.delegates = [
        {
          delegate: app.user.activeAccount,
          delegateAddress: '0xasdsasd24ewrqwsdanf',
          delegateName: 'Alex Young',
          voteWeight: 12.9,
          totalVotes: 100,
          proposals: 4,
          rank: 1, // TODO: Determine if the sorting happens in the route or here. If not here, then we need to sort and add this rank value
        },
        {
          delegate: app.user.activeAccount,
          delegateAddress: '0x1234asdf14sdfa',
          delegateName: 'Other Guy',
          voteWeight: 12.9,
          totalVotes: 100,
          proposals: 4,
          rank: 2,
        },
      ]; // TODO: Replace with fetch of all the delegates

      m.redraw();
    }

    const updateFilter = (value: string) => {};

    return (
      <Sublayout class="DelegationPage" title="Delegation">
        <div class="top-section">
          {this.delegate ? (
            <div class="delegate-card-wrapper">
              <div class="delegate-header">Delegates</div>
              <div class="your-delegate">Your Delegate</div>
              {
                // Include Info Icon when accessible
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
          <CWTextInput
            name="Form field"
            oninput={(e) => {
              console.log((e.target as any).value);
              updateFilter((e.target as any).value);
            }}
            placeholder="Search Delegates"
          />
          <CWTable
            columns={dummyTableData.columns}
            data={dummyTableData.data}
          />
        </div>
      </Sublayout>
    );
  }
}

export default DelegationPage;
