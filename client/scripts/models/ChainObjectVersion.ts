class ChainObjectVersion {
  constructor(
    public readonly id: string,
    public readonly chain: string,
    public readonly uniqueIdentifier: string,
    public readonly completionField: string,
  ) { }
  public static fromJSON(json) {
    return new ChainObjectVersion(
      json.id,
      json.chain,
      json.unique_identifier,
      json.completion_field,
    );
  }
}

export default ChainObjectVersion;
