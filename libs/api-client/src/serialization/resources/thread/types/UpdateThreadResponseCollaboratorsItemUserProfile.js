/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateThreadResponseCollaboratorsItemUserProfileBackgroundImage } from './UpdateThreadResponseCollaboratorsItemUserProfileBackgroundImage';

export const UpdateThreadResponseCollaboratorsItemUserProfile =
  core.serialization.object({
    name: core.serialization.string().optional(),
    email: core.serialization.string().optional(),
    website: core.serialization.string().optional(),
    bio: core.serialization.string().optional(),
    avatarUrl: core.serialization.property(
      'avatar_url',
      core.serialization.string().optional(),
    ),
    slug: core.serialization.string().optional(),
    socials: core.serialization.list(core.serialization.string()).optional(),
    backgroundImage: core.serialization.property(
      'background_image',
      UpdateThreadResponseCollaboratorsItemUserProfileBackgroundImage.optional(),
    ),
  });
