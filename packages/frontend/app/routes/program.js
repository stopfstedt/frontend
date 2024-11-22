import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProgramRoute extends Route {
  @service permissionChecker;
  @service session;
  @service store;
  @service currentUser;
  @service router;

  canUpdate = false;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
    if (!this.currentUser.performsNonLearnerFunction) {
      this.router.replaceWith('/four-oh-four');
    }
  }

  model(params) {
    return this.store.findRecord('program', params.program_id);
  }

  async afterModel(program) {
    const permissionChecker = this.permissionChecker;
    const canUpdate = await permissionChecker.canUpdateProgram(program);
    this.set('canUpdate', canUpdate);
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.set('canUpdate', this.canUpdate);
  }
}
