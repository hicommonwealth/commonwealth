import { Role } from 'server/models/role';

// DEPRECATED. This class is currently obtained by getting Address information.
// If you can, just query for address instead.
class CommunityRole {
  public readonly id: number;
  public readonly name: Role;
  public readonly community_id: string;
  public readonly allow: number;
  public readonly deny: number;
  public readonly createdAt: moment.Moment;
  public readonly updatedAt: moment.Moment;

  constructor(id, name, community_id, allow, deny, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.community_id = community_id;
    this.allow = allow;
    this.deny = deny;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static fromJSON({
    id,
    name,
    community_id,
    allow,
    deny,
    createdAt,
    updatedAt,
  }) {
    return new CommunityRole(
      id,
      name,
      community_id,
      allow,
      deny,
      createdAt,
      updatedAt,
    );
  }
}

export default CommunityRole;
