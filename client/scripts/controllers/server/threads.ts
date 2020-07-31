/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import moment from 'moment-twitter';
import { ProposalStore, TagStore } from 'stores';
import { OffchainThread, OffchainAttachment, OffchainTag, CommunityInfo } from 'models';

import $ from 'jquery';
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

  public async create(
    address: string,
    kind: string,
    chainId: string,
    communityId: string,
    title: string,
    tagName: string,
    tagId: number,
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

    try {
      // TODO: Change to POST /thread
      const response = await $.post(`${app.serverUrl()}/createThread`, {
        'author_chain': app.user.activeAccount.chain.id,
        'chain': chainId,
        'community': communityId,
        'address': address,
        'title': encodeURIComponent(title),
        'body': encodeURIComponent(body),
        'kind': kind,
        'versionHistory': versionHistory,
        'attachments[]': attachments,
        'mentions[]': mentions,
        'tag_name': tagName,
        'tag_id': tagId,
        'url': url,
        'privacy': privacy,
        'readOnly': readOnly,
        'jwt': app.user.jwt,
      });
      const result = modelFromServer(response.result);
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to create thread');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to create thread');
    }
  }

  public async edit(
    proposal: OffchainThread,
    body?: string,
    attachments?: string[],
    readOnly?: boolean,
    privacy?: boolean
  ) {
    const newBody = body || proposal.body;
    const newReadOnly = (typeof readOnly === 'boolean') ? readOnly : proposal.readOnly;
    const newPrivacy = (typeof privacy === 'boolean') ? privacy : proposal.privacy;
    const recentEdit : any = { timestamp: moment(), body };
    const versionHistory = JSON.stringify(recentEdit);
    await $.ajax({
      url: `${app.serverUrl()}/editThread`,
      type: 'PUT',
      data: {
        'thread_id': proposal.id,
        'kind': proposal.kind,
        'body': encodeURIComponent(newBody),
        'version_history': versionHistory,
        'attachments[]': attachments,
        'read_only': newReadOnly,
        'privacy': newPrivacy,
        'jwt': app.user.jwt
      },
      success: (response) => {
        const result = modelFromServer(response.result);
        if (this._store.getByIdentifier(result.id)) {
          this._store.remove(this._store.getByIdentifier(result.id));
        }
        this._store.add(result);
        return result;
      },
      error: (err) => {
        console.log('Failed to edit thread');
        throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
          : 'Failed to edit thread');
      }
    });
  }

  public async delete(proposal) {
    const _this = this;
    return new Promise((resolve, reject) => {
      // TODO: Change to DELETE /thread
      $.post(`${app.serverUrl()}/deleteThread`, {
        'jwt': app.user.jwt,
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

  public async setPrivacy({ threadId, privacy, readOnly }: { threadId: Number; privacy: boolean; readOnly: boolean; }) {
    return $.ajax({
      url: `${app.serverUrl()}/setPrivacy`,
      type: 'POST',
      data: {
        'jwt': app.user.jwt,
        'thread_id': threadId,
        'privacy': privacy,
        'read_only': readOnly,
      },
      success: (response) => {
        console.dir(response);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  public refreshAll(chainId: string, communityId: string, reset = false) {
    // TODO: Change to GET /threads
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
