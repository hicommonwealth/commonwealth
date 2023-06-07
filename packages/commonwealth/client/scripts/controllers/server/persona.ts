import $ from 'jquery';
import axios from 'axios';
import Persona from '../../models/Persona';
import app from 'state';
import PersonaStore from '../../stores/PersonaStore';
import moment from 'moment';

export const modelFromServer = (persona) => {
  const {
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
  } = persona;

  const modeledPersona = new Persona({
    id,
    name,
    personality,
    jwt,
    last_visited: moment(last_visited),
    public_key,
    private_key,
    collection_name,
    karma,
    created_at: created_at ? moment(created_at) : undefined,
    updated_at: updated_at ? moment(updated_at) : undefined,
  });

  return modeledPersona;
};

class PersonasController {
  private _store = new PersonaStore();

  public get store() {
    return this._store;
  }

  private _initializing = false;
  private _initialized = false;
  public get initialized() {
    return this._initialized;
  }

  public async init() {
    if (this._initializing) return;
    this._initializing = true;
    try {
      // Add any initialization logic here, e.g., fetch data from the server
      // For example:
      // init the store
      const res = await this.getFilteredPersonas('Dillbot');
      console.log(res[0].name, 'res');
    } catch (e) {
      console.error(`Failed to initialize PersonasController: ${e.message}`);
    }
    this._initializing = false;
    this._initialized = true;
  }

  public async deinit() {
    this._initialized = false;
    this._store.clear();
  }

  public async createPersona(args: { name: string; personality: string }) {
    const { name, personality } = args;

    try {
      const response = await axios.post(`${app.serverUrl()}/personas/create`, {
        name,
        personality,
        jwt: app.user.jwt,
      });

      const modeledPersona = modelFromServer(response.data.result.persona);
      this._store.add(modeledPersona);
    } catch (err) {
      console.log('Failed to create persona');
      throw new Error(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to create persona'
      );
    }
  }
  public async updatePersona(args: {
    id: number;
    name: string;
    personality: string;
  }) {
    const { id, name, personality } = args;

    try {
      const response = await axios.put(`${app.serverUrl()}/personas/put`, {
        id,
        name,
        personality,
        jwt: app.user.jwt,
      });

      const modeledPersona = modelFromServer(response.data.result.persona);
      this._store.add(modeledPersona);
    } catch (err) {
      console.log('Failed to update persona');
      throw new Error(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to update persona'
      );
    }
  }

  public async deletePersona(args: { id: number }) {
    const { id } = args;

    try {
      const response = await axios.delete(
        `${app.serverUrl()}/personas/delete`,
        {
          data: {
            id,
            jwt: app.user.jwt,
          },
        }
      );

      this._store.removeById(response.data.result.id);
    } catch (err) {
      console.log('Failed to delete persona');
      throw new Error(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to delete persona'
      );
    }
  }

  public async getFilteredPersonas(
    name: string
  ): Promise<Persona[] | undefined> {
    try {
      const response = await axios.get(`${app.serverUrl()}/personas/get`, {
        params: {
          name,
          jwt: app.user.jwt,
        },
      });

      const filteredPersonas = response.data.result.persona.map((persona) => {
        const model = modelFromServer(persona);
        this._store.add(model);
      });
      return filteredPersonas;
    } catch (err) {
      throw new Error(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to fetch filtered personas'
      );
    }
  }

  public getById(id: number): Persona | undefined {
    return this._store.getById(id);
  }

  public getByName(name: string): Persona | undefined {
    return this._store.getByName(name);
  }
}

export default PersonasController;
