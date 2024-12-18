import { Actor, INVALID_ACTOR_ERROR, InvalidActor } from '@hicommonwealth/core';
import { GroupPermissionAction } from '@hicommonwealth/schemas';

export class BannedActor extends InvalidActor {
  constructor(public actor: Actor) {
    super(actor, 'Banned User');
    this.name = INVALID_ACTOR_ERROR;
  }
}

export class NonMember extends InvalidActor {
  constructor(
    public actor: Actor,
    public topic: string,
    public action: GroupPermissionAction,
  ) {
    super(
      actor,
      `User does not have permission to perform action ${action} in topic ${topic}`,
    );
    this.name = INVALID_ACTOR_ERROR;
  }
}

export class RejectedMember extends InvalidActor {
  constructor(
    public actor: Actor,
    public reasons: string[],
  ) {
    super(actor, reasons.join(', '));
    this.name = INVALID_ACTOR_ERROR;
  }
}
