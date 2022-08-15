export interface IParticipant {
  id: number;
  projectId: number;
}

class ParticipantStore<ParticipantT extends IParticipant> {
  private _store: {
    [projectId: number]: { [participantId: number]: ParticipantT };
  } = {};

  public addOrUpdate(participant: ParticipantT) {
    const { projectId } = participant;
    if (!this._store[projectId]) {
      this._store[projectId] = {};
    }
    // just update amount
    this._store[projectId][participant.id] = participant;
    return this;
  }

  // May be unnecessary
  public remove(participant: ParticipantT) {
    const projectStore = this._store[participant.projectId];
    if (projectStore) {
      delete this._store[participant.projectId][participant.id];
    }
    return this;
  }

  public clear() {
    this._store = {};
  }

  public getByProjectAndId(projectId, participantId) {
    const projectStore = this._store[projectId];
    return projectStore ? projectStore[participantId] : null;
  }
}

export default ParticipantStore;
