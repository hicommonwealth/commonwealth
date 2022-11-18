import m from 'mithril';
import $ from 'jquery';
import { RegisteredTypes } from '@polkadot/types/types';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
import { ChainNetwork, ChainBase } from 'common-common/src/types';
import { Permission } from 'server/models/role';
import NodeInfo from './NodeInfo';

import {
  CWAvatar,
  CWJdenticon,
} from '../views/components/component_kit/cw_avatar';

class CommunityRole {
  public readonly id: number;
  public readonly name: Permission;
  public readonly chain_id: string;
  public readonly allow: bigint;
  public readonly deny: bigint;
  public readonly createdAt: moment.Moment;
  public readonly updatedAt: moment.Moment;

  constructor({ id, name, chain_id, allow, deny, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.chain_id = chain_id;
    this.allow = allow;
    this.deny = deny;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static fromJSON({
    id,
    name,
    chain_id,
    allow,
    deny,
    createdAt,
    updatedAt,
  }) {
    return new CommunityRole({
      id,
      name,
      chain_id,
      allow,
      deny,
      createdAt,
      updatedAt,
    });
  }
}

export default CommunityRole;
