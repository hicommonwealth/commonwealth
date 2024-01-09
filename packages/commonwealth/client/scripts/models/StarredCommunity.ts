class StarredCommunity {
  user_id: number;
  community_id: string;

  constructor(chain: string, user_id: number) {
    this.community_id = chain;
    this.user_id = user_id;
  }
}

export default StarredCommunity;
