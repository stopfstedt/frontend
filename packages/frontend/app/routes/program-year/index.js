import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProgramYearIndexRoute extends Route {
  @service permissionChecker;
  @service session;
  @service currentUser;
  @service router;

  canUpdate = false;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
    if (!this.currentUser.performsNonLearnerFunction) {
      this.router.replaceWith('/four-oh-four');
    }
  }

  async afterModel(programYear) {
    await programYear.program;
    const permissionChecker = this.permissionChecker;
    const canUpdate = await permissionChecker.canUpdateProgramYear(programYear);
    this.set('canUpdate', canUpdate);
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.set('canUpdate', this.canUpdate);
  }
}
