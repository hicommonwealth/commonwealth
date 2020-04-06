import $ from 'jquery';
import moment from 'moment';

import app from 'state';
import { idToProposal, getProposalObservable } from 'identifiers';
import { Unsubscribable } from 'rxjs';
import { AnyProposal } from 'models';

/* EXAMPLE RESPONSE
{
  "status":"Success",
  "result":[{
    "id":2,
    "chain":"edgeware",
    identifier":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY-3-0",
    "type":"council_candidacy",
    "data":"{
      \"hash\":\"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY-3-0\",
      \"account\":\"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\",
      \"voteIndex\":3,\"slot\":0
    }",
    "created_at":"2019-04-29T18:06:00.158Z",
    "updated_at":"2019-04-29T18:06:00.158Z",
    "deleted_at":null
  }]
}
*/

export class ProposalArchiveController {
  private _latestProposal: moment.Moment = moment(0);

  private _proposalSubscription: Unsubscribable;

  public init() {
    this._proposalSubscription = getProposalObservable()
      .subscribe(([p]: [AnyProposal, string]) => {
        this.refresh(p);
      });
    return this.refreshAll();
  }

  public deinit() {
    if (this._proposalSubscription) {
      this._proposalSubscription.unsubscribe();
    }
  }

  public async refresh(p: AnyProposal) {
    try {
      const response = await $.get(`${app.serverUrl()}/bulkProposals`, {
        chain: app.activeChainId(),
        type: p.slug,
        identifier: p.identifier,
      });
      if (response.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${response.status}`);
      } else if (response.result.length === 0) {
        throw new Error(`found no database entries for ${p.title}`);
      } else if (response.result.length > 1) {
        throw new Error(`found duplicate database entries for ${p.title}`);
      }
      p.createdAt = moment(response.result[0].created_at);
    } catch (err) {
      console.log('failed to load single proposal');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Error loading proposal archive');
    }
  }

  public async refreshAll() {
    try {
      const response = await $.get(`${app.serverUrl()}/bulkProposals`, {
        chain: app.activeChainId(),
        after: this._latestProposal > moment(0) ? `${this._latestProposal.toISOString()}` : undefined,
      });
      if (response.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${response.status}`);
      }
      if (response.result.length > 0) {
        this._latestProposal = moment(response.result[0]);
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const result of response.result) {
        try {
          const proposal = idToProposal(result.type, result.identifier);
          proposal.createdAt = moment(result.created_at);
        } catch (e) {
          // proposal has already completed/does not exist, do nothing
        }
      }
    } catch (err) {
      console.log('failed to load bulk proposals');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Error loading proposal archive');
    }
  }
}

export default ProposalArchiveController;
