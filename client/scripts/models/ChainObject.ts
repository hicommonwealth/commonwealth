class ChainObject<T> {
  constructor(
    public readonly id: string,
    public readonly objectType: string,
    public readonly objectId: string,
    public readonly completed: boolean,
    public readonly objectData: T,
  ) { }
  public static fromJSON(json) {
    return new ChainObject(
      json.id,
      json.object_type,
      json.object_id,
      json.completed,
      JSON.parse(json.object_data)
    );
  }
}

export default ChainObject;