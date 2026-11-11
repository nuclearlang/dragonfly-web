import { AppEvent, Json } from 'dragonfly-web';

/** The backend asks to close the session. */
export class ForceLogout extends AppEvent {
  readonly reason?: string | null;

  constructor(init: { reason?: string | null } = {}) {
    super();
    this.reason = init.reason;
  }

  static fromJson(json: Json): ForceLogout {
    return new ForceLogout({
      reason: json['reason'] as string | null,
    });
  }

  get eventName(): string {
    return 'ForceLogout';
  }

  toJson(): Json {
    return {
      reason: this.reason,
    };
  }
}
