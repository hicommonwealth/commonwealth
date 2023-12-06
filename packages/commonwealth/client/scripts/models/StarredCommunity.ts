class StarredCommunity {
  user_id: number;
  chain: string;

  constructor(chain, user_id) {
    this.chain = chain;
    this.user_id = user_id;
  }
}

export default StarredCommunity;
