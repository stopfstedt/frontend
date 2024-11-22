import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CurriculumInventoryReportReport extends Route {
  @service session;
  @service store;
  @service currentUser;
  @service router;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
    if (!this.currentUser.performsNonLearnerFunction) {
      this.router.replaceWith('/four-oh-four');
    }
  }

  model(params) {
    return this.store.findRecord(
      'curriculum-inventory-report',
      params.curriculum_inventory_report_id,
    );
  }
}
