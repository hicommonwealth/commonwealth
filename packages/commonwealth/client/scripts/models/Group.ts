import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod/v4';

class Group {
  public id: number;
  public communityId: string;
  public createdAt: string; // ISO string
  public updatedAt: string; // ISO string
  public name: string;
  public description?: string;
  public groupImageUrl?: string | null;
  public requirements: any[];
  public topics: any[];
  public members: any[];
  public requirementsToFulfill: number;

  constructor({
    id,
    community_id,
    created_at,
    updated_at,
    metadata,
    requirements,
    topics,
    memberships,
  }: z.infer<typeof schemas.GroupView>) {
    this.id = id;
    this.communityId = community_id;
    this.createdAt = created_at!.toString();
    this.updatedAt = updated_at!.toString();
    this.name = metadata.name;
    this.description = metadata.description;
    this.groupImageUrl = metadata.groupImageUrl;
    this.requirements = requirements;
    this.topics = topics;
    this.members = memberships;
    // @ts-expect-error StrictNullChecks
    this.requirementsToFulfill = metadata.required_requirements;
  }
}

export default Group;
