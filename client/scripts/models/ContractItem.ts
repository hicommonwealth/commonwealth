import ContractCategory from './ContractCategory';

export class ContractItem {
  public readonly name: string;
  public readonly description: string;
  public readonly id: number;
  public readonly color: string;
  public readonly category: ContractCategory;

  constructor(name, description, id, color, category) {
    this.name = name;
    this.description = description;
    this.id = id;
    this.color = color;
    this.category = category;
  }
  public static fromJSON(json) {
    return new ContractItem(json.name, json.description, json.id, json.color, json.category);
  }
}

export default ContractItem;
