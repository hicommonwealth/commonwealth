class StarredCommunity {
  user_id: number;
  community: string;

  constructor(community, user_id) {
    this.community = community;
    this.user_id = user_id;
  }
}

export default StarredCommunity;
