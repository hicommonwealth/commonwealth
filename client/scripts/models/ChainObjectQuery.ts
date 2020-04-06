class ChainObjectQuery {
  constructor(
    public readonly id: number,
    public readonly objectType: string,
    public readonly queryType: string,
    public readonly active: boolean,
    public readonly description: string,
    public readonly queryUrl: string,
    public readonly query: string,
  ) { }
  public static fromJSON(json) {
    return new ChainObjectQuery(
      json.id,
      json.object_type,
      json.query_type,
      json.active,
      json.description,
      json.query_url,
      json.query
    );
  }
}

export default ChainObjectQuery;
