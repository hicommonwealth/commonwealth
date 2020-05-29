/* eslint-disable no-restricted-syntax */
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';
import { ProposalStore } from 'stores';
import { OffchainThread, OffchainAttachment, OffchainTag, CommunityInfo } from 'models';

import { default as $ } from 'jquery';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';

const modelFromServer = (thread) => {
  const attachments = thread.OffchainAttachments
    ? thread.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  return new OffchainThread(
    thread.Address.address,
    decodeURIComponent(thread.title),
    attachments,
    thread.id,
    moment(thread.created_at),
    thread.tag,
    thread.kind,
    thread.version_history,
    thread.community,
    thread.chain,
    thread.private,
    thread.read_only,
    decodeURIComponent(thread.body),
    thread.url,
    thread.Address.chain,
    thread.pinned,
  );
};

class ThreadsController {
  private _store = new ProposalStore<OffchainThread>();

  public get store() { return this._store; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public getType(primary: string, secondary?: string, tertiary?: string) {
    const result = this._store.getAll().filter((thread) => {
      return tertiary
        ? thread.kind === primary || thread.kind === secondary || thread.kind === tertiary
        : secondary
          ? thread.kind === primary || thread.kind === secondary
          : thread.kind === primary;
    });
    return result;
  }

  public create(
    address: string,
    kind: string,
    chainId: string,
    communityId: string,
    title: string,
    tag?: OffchainTag | string,
    body?: string,
    url?: string,
    attachments?: string[],
    mentions?: string[],
    privacy?: boolean,
    readOnly?: boolean
  ) {
    const timestamp = moment();
    const firstVersion : any = { timestamp, body };
    const versionHistory : string = JSON.stringify(firstVersion);
    return $.post(`${app.serverUrl()}/createThread`, {
      'author_chain': app.vm.activeAccount.chain.id,
      'chain': chainId,
      'community': communityId,
      'address': address,
      'title': encodeURIComponent(title),
      'body': encodeURIComponent(body),
      'kind': kind,
      'versionHistory': versionHistory,
      'attachments[]': attachments,
      'mentions[]': mentions,
      'tag': (tag as OffchainTag).id || tag,
      'url': url,
      'privacy': privacy,
      'readOnly': readOnly,
      'jwt': app.login.jwt,
    }).then((response) => {
      const result = modelFromServer(response.result);
      this._store.add(result);
      return result;
    }, (err) => {
      console.log('Failed to create thread');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to create thread');
    });
  }

  public async edit(
    proposal: OffchainThread,
    body?: string,
    attachments?: string[],
    readOnly?: boolean,
    privacy?: boolean
  ) {
    const newBody = body || proposal.body;
    const newReadOnly = readOnly || proposal.readOnly;
    const newPrivacy = privacy || proposal.privacy;
    const recentEdit : any = { timestamp: moment(), body };
    const versionHistory = JSON.stringify(recentEdit);

    try {
      const response = await $.post(`${app.serverUrl()}/editThread`, {
        'thread_id': proposal.id,
        'kind': proposal.kind,
        'body': encodeURIComponent(newBody),
        'version_history': versionHistory,
        'attachments[]': attachments,
        'read_only': newReadOnly,
        'privacy': newPrivacy,
        'jwt': app.login.jwt
      });
      const result = modelFromServer(response.result);
      if (this._store.getByIdentifier(result.id)) {
        this._store.remove(this._store.getByIdentifier(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit thread');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to edit thread');
    }
  }

  public async delete(proposal) {
    const _this = this;
    return new Promise((resolve, reject) => {
      $.post(`${app.serverUrl()}/deleteThread`, {
        'jwt': app.login.jwt,
        'thread_id': proposal.id,
      }).then((result) => {
        _this.store.remove(proposal);
        resolve(result);
      }).catch((e) => {
        console.error(e);
        notifyError('Could not delete thread');
        reject(e);
      });
    });
  }

  public refreshAll(chainId: string, communityId: string, reset = false) {
    return $.get(`${app.serverUrl()}/bulkThreads`, {
      chain: chainId,
      community: communityId,
    })
      .then((response) => {
        if (response.status !== 'Success') {
          throw new Error(`Unsuccessful refresh status: ${response.status}`);
        }
        if (reset) {
          this._store.clear();
        }
        // Threads that are posted in an offchain community are still linked to a chain / author address,
        // so when we want just chain threads, then we have to filter away those that have a community
        const threads = (app.chain) ? response.result.filter((thread) => !thread.community) : response.result;

        for (const thread of threads) {
          // TODO: OffchainThreads should always have a linked Address
          if (!thread.Address) {
            console.error('OffchainThread missing address');
          }
          // TODO: check `response` against store and update store iff `response` is newer
          const existing = this._store.getByIdentifier(thread.id);
          if (existing) {
            this._store.remove(existing);
          }
          try {
            this._store.add(modelFromServer(thread));
          } catch (e) {
            console.error(e.message);
          }
        }
        this._initialized = true;
      }, (err) => {
        console.log('failed to load offchain discussions');
        throw new Error((err.responseJSON && err.responseJSON.error)
          ? err.responseJSON.error
          : 'Error loading offchain discussions');
      });
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }
}

export default ThreadsController;
