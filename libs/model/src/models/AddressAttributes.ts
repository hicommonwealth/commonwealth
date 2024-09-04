import {
  CommunityAttributes,
  MembershipAttributes,
} from '@hicommonwealth/model';
import { Address } from '@hicommonwealth/schemas';
import { z } from 'zod';

export type AddressAttributes = z.infer<typeof Address> & {
  // associations
  Community?: CommunityAttributes;
  Memberships?: MembershipAttributes[];
};
