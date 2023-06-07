import type Persona from '../models/Persona';
import IdStore from './IdStore';

class PersonaStore extends IdStore<Persona> {
  public add(persona: Persona) {
    super.add(persona);
    return this;
  }

  public remove(persona: Persona) {
    super.remove(persona);
    return this;
  }

  public clear() {
    super.clear();
  }

  public getById(id: number): Persona | undefined {
    return this._store.find((persona) => persona.id === id);
  }

  public removeById(id: number) {
    return this.remove(this.getById(id));
  }

  public getByName(name: string): Persona | undefined {
    return this._store.find((persona) => persona.name === name);
  }
}

export default PersonaStore;
