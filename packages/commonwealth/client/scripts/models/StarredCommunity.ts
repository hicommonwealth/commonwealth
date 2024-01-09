class StarredCommunity {
  user_id: number;
  community_id: string;

  constructor({
    community_id,
    user_id,
  }: {
    community_id: string;
    user_id: number;
  }) {
    this.community_id = community_id;
    this.user_id = user_id;
  }
}

export default StarredCommunity;
