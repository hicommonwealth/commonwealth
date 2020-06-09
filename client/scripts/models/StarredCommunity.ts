class StarredCommunity {
  user_id: number;
  chain: string;
  community: string;

  constructor(chain, community, user_id) {
    this.chain = chain;
    this.community = community;
    this.user_id = user_id;
  }
}

export default StarredCommunity;
