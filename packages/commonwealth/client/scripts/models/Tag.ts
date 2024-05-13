export type TagAttributes = {
  id: number;
  name: string;
};

class Tag {
  public readonly id: number;
  public readonly name: string;

  constructor({ id, name }: TagAttributes) {
    this.id = id;
    this.name = name;
  }
}

export default Tag;
