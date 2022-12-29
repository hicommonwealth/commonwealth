import axios from 'axios';
import { NotificationCategory } from './models/index';
import { InviteCodeAttributes } from '../../shared/types';
import { ChainCategoryTypeAttributes } from '../../server/models/chain_category_type';
import { ChainNodeAttributes } from '../../server/models/chain_node';
import ChainEntity from './models/ChainEntity';
import RoleInfo from './models/RoleInfo';
import { ChainCategoryAttributes } from '../../server/models/chain_category';
import ChainInfo from './models/ChainInfo';

// This class's responsibility is to abstract away the server calls to app state. The current implementation
// lazily loads data from the server when called
export class AppConfig {
  private serverUrl: string;
  private chains: Map<string, ChainInfo> = new Map(); // maps chainId to chain
  private nodes: Map<string, ChainNodeAttributes[]> = new Map(); // maps chainId to ChainNodes
  private notificationCategories: NotificationCategory[];
  private chainCategories: ChainCategoryAttributes[];
  private chainCategoryTypes: ChainCategoryTypeAttributes[];

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  public async getChains(): Promise<ChainInfo[]> {
    const resp = await axios.get(
      `${this.serverUrl}/communities`,
      { params: { is_active: true } }
    );

    return resp.data.result.communities.map(e => ChainEntity.fromJSON(e));
  }

  public async getChain(id: string): Promise<ChainInfo> {
    if (this.chains.get(id)) {
      return this.chains.get(id);
    }

    (await this.getChains()).forEach(c => this.chains.set(c.id, c));

    return this.chains.get(id);
  }

  public async getThreadCount(chain: string): Promise<number> {
    const threadCount = await axios.get(`${this.serverUrl}/threads`, {
      params: {
        community_id: chain,
        count_only: true
      }
    });

    return threadCount.data.result.count;
  }

  public async getRoles(chain: string): Promise<RoleInfo[]> {
    const roles = await axios.get(`${this.serverUrl}/roles`, {
      params: {
        community_id: chain
      }
    });

    return roles.data.result.roles.map(r => RoleInfo.fromJSON(r));
  }

  // TODO: All methods below query entities that don't update frequently so should be cached server side via Redis
  public async getInvites(chain_id: string): Promise<InviteCodeAttributes[]> {
    const invites = await axios.get(`${this.serverUrl}/inviteCodes`, { params: { chain_id } });

    return invites.data.inviteCodes;
  }

  // these methods cache after query, and never refresh. Reasoning for this is that these tables rarely change
  public async getChainNodes(chain: string): Promise<ChainNodeAttributes[]> {
    if (this.nodes[chain]) return this.nodes[chain];

    const resp = await axios.get(`${this.serverUrl}/chainNodes`, { params: { community_id: chain } });

    this.nodes[chain] = resp.data.result.chain_nodes;

    return this.nodes[chain];
  }

  public async getChainCategories(): Promise<ChainCategoryAttributes[]> {
    if (this.chainCategories) return this.chainCategories;

    const resp = await axios.get(`${this.serverUrl}/chainCategories`);
    this.chainCategories = resp.data.chainCategories;

    return this.chainCategories;
  }

  public async getChainCategoryTypes(): Promise<ChainCategoryTypeAttributes[]> {
    if (this.chainCategoryTypes) return this.chainCategoryTypes;

    const resp = await axios.get(`${this.serverUrl}/chainCategoryTypes`);
    this.chainCategoryTypes = resp.data.chainCategoryTypes;

    return this.chainCategoryTypes;
  }

  public async getNotificationCategories(): Promise<NotificationCategory[]> {
    if (this.notificationCategories) return this.notificationCategories;

    const resp = await axios.get(`${this.serverUrl}/notificationCategories`);
    this.notificationCategories = resp.data.notificationCategories;

    return this.notificationCategories;
  }
}