/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../../core';
import { CreateCommunityRequestBase } from '../../types/CreateCommunityRequestBase';
import { CreateCommunityRequestType } from '../../types/CreateCommunityRequestType';
export const CreateCommunityRequest = core.serialization.object({
  id: core.serialization.string(),
  name: core.serialization.string(),
  chainNodeId: core.serialization.property(
    'chain_node_id',
    core.serialization.number(),
  ),
  description: core.serialization.string().optional(),
  iconUrl: core.serialization.property(
    'icon_url',
    core.serialization.string().optional(),
  ),
  socialLinks: core.serialization.property(
    'social_links',
    core.serialization.list(core.serialization.string()).optional(),
  ),
  tags: core.serialization.list(core.serialization.string()).optional(),
  directoryPageEnabled: core.serialization.property(
    'directory_page_enabled',
    core.serialization.boolean().optional(),
  ),
  type: CreateCommunityRequestType.optional(),
  base: CreateCommunityRequestBase,
  tokenName: core.serialization.property(
    'token_name',
    core.serialization.string().optional(),
  ),
  defaultSymbol: core.serialization.property(
    'default_symbol',
    core.serialization.string(),
  ),
  website: core.serialization.string().optional(),
  github: core.serialization.string().optional(),
  telegram: core.serialization.string().optional(),
  element: core.serialization.string().optional(),
  discord: core.serialization.string().optional(),
});
