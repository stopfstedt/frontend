import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class InstructorGroupsRoute extends Route {
  @service store;
  @service session;
  @service currentUser;
  @service router;

  queryParams = {
    titleFilter: {
      replace: true,
    },
  };

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
