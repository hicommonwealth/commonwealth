class NewChainInfo {
  public readonly address: string;
  public readonly iconUrl: string;
  public readonly name: string;
  public readonly symbol: string;

  constructor(address, iconUrl, name, symbol) {
    this.address = address;
    this.iconUrl = iconUrl;
    this.name = name;
    this.symbol = symbol;
  }
}

export default NewChainInfo;
