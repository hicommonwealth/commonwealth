class ContractCategory {
  public readonly name: string;
  public readonly description: string;
  public readonly id: number;
  public readonly color: string;

  constructor(name, description, id, color) {
    this.name = name;
    this.description = description;
    this.id = id;
    this.color = color;
  }
  public static fromJSON(json) {
    return new ContractCategory(json.name, json.description, json.id, json.color);
  }
}

export default ContractCategory;
