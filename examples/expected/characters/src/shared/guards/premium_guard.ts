import { Guard, SessionManager } from 'dragonfly-web';

/** Guard: a custom access check, like NestJS CanActivate. */
export class PremiumGuard extends Guard {
  constructor(private readonly session: SessionManager) {
    super();
  }

  override canActivate(): boolean {
    return this.session.value<boolean>('premium') !== false;
  }
}
