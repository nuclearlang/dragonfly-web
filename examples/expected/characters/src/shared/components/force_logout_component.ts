import { ForceLogout } from '../events/force_logout';
import { SessionManager } from 'dragonfly-web';

/** Global component: runs with every ForceLogout, wherever the user is. */
export class ForceLogoutComponent {
  constructor(private readonly session: SessionManager) {}

  async exec(event: ForceLogout): Promise<void> {
    await this.session.destroy();
  }
}
