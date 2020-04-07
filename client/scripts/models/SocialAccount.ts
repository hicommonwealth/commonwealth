class SocialAccount {
  public readonly provider: string;
  public readonly username: string;

  constructor(provider, username) {
    this.provider = provider;
    this.username = username;
  }
}

export default SocialAccount;
