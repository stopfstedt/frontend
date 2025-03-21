import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CurriculumInventoryReportRolloverRoute extends Route {
  @service permissionChecker;
  @service session;
  canUpdate = false;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
  }

  async afterModel(report) {
    const permissionChecker = this.permissionChecker;
    this.canUpdate = await permissionChecker.canUpdateCurriculumInventoryReport(report);
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.set('hasUpdatePermissions', this.canUpdate);
  }
}
