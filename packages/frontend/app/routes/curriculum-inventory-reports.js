import { service } from '@ember/service';
import Route from '@ember/routing/route';

export default class CurriculumInventoryReportsRoute extends Route {
  @service currentUser;
  @service store;
  @service session;
  @service router;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
    if (!this.currentUser.performsNonLearnerFunction) {
      this.router.replaceWith('/four-oh-four');
    }
  }

  async model() {
    return this.store.findAll('school');
  }
}
