import {
  CommunityAttributes,
  MembershipAttributes,
} from '@hicommonwealth/model';
import { Group } from '@hicommonwealth/schemas';
import z from 'zod';

export type GroupAttributes = z.infer<typeof Group> & {
  // associations
  community?: CommunityAttributes;
  memberships?: MembershipAttributes[];
};
