/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateCommunityResponseCommunity } from './CreateCommunityResponseCommunity';

export const CreateCommunityResponse = core.serialization.object({
  community: CreateCommunityResponseCommunity,
  adminAddress: core.serialization.property(
    'admin_address',
    core.serialization.string().optional(),
  ),
});
