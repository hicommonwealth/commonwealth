import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes } from './address';
import type { ChainAttributes } from './chain';
import type { ModelInstance, ModelStatic } from './types';

export type Role = 'admin' | 'moderator' | 'member';

export function isRole(role): boolean {
  return role === 'admin' || role === 'moderator' || role === 'member';
}

export type RoleAttributes = {
  address_id: number;
  permission: Role;
  id?: number;
  chain_id: string;
  is_user_default?: boolean;
  created_at?: Date;
  updated_at?: Date;

  // associations
  Address?: AddressAttributes;
  Chain?: ChainAttributes;
};
