class SocialAccount {
  public readonly provider: string;
  public readonly username: string;
  public readonly attested: string;

  constructor(provider, username, attested) {
    this.provider = provider;
    this.username = username;
    this.attested = attested;
  }
}

export default SocialAccount;
