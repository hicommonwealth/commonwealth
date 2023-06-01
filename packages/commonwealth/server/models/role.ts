import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes } from './address';
import type { ChainAttributes } from './chain';
import type { ModelInstance, ModelStatic } from './types';

export type Role = 'admin' | 'moderator' | 'member';

export function isRole(role): boolean {
  return role === 'admin' || role === 'moderator' || role === 'member';
}

export function permissionAllowed(bitmask: number, permission: Role): boolean {
  if (permission === 'admin') {
    return (bitmask & 1) === 1;
  } else if (permission === 'moderator') {
    return (bitmask & 0b10) >> 1 === 1;
  }

  return (bitmask & 0b10) >> 1 === 1;
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

export type RoleInstance = ModelInstance<RoleAttributes>;
