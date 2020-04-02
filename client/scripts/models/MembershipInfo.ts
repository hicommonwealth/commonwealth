class MembershipInfo {
  public readonly user_id: number;
  public readonly chain: string;
  public readonly community: string;
  public readonly active: boolean;

  constructor(user_id, chain, community, active) {
    this.user_id = user_id;
    this.chain = chain;
    this.community = community;
    this.active = active;
  }
}

export default MembershipInfo;
