import type moment from 'moment';
import app from '../state';

class Persona {
  public readonly id: number;
  public readonly name: string;
  public readonly personality: string;
  public readonly jwt?: string;
  public readonly last_visited?: moment.Moment;
  public readonly public_key?: string;
  public readonly private_key?: string;
  public readonly collection_name?: string;
  public readonly karma?: number;
  public readonly created_at?: moment.Moment;
  public readonly updated_at?: moment.Moment;

  constructor({
    id,
    jwt,
    name,
    last_visited,
    public_key,
    private_key,
    collection_name,
    personality,
    karma,
    created_at,
    updated_at,
  }: {
    id: number;
    name: string;
    personality: string;
    jwt?: string;
    last_visited?: moment.Moment;
    public_key?: string;
    private_key?: string;
    collection_name?: string;
    karma?: number;
    created_at?: moment.Moment;
    updated_at?: moment.Moment;
  }) {
    this.id = id;
    this.jwt = jwt;
    this.name = name;
    this.last_visited = last_visited;
    this.public_key = public_key;
    this.private_key = private_key;
    this.collection_name = collection_name;
    this.personality = personality;
    this.karma = karma;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  public async save() {
    if (this.id) {
      const updatedPersona = await app.personas.updatePersona({
        id: this.id,
        name: this.name,
        personality: this.personality,
      });
      return updatedPersona;
    } else {
      const createdPersona = await app.personas.createPersona({
        name: this.name,
        personality: this.personality,
      });
      return createdPersona;
    }
  }

  public async delete() {
    await app.personas.deletePersona({ id: this.id });
  }
}

export default Persona;
