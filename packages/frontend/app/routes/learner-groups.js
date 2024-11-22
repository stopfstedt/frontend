import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class LearnerGroupsRoute extends Route {
  @service dataLoader;
  @service session;
  @service currentUser;
  @service router;

  queryParams = {
    filter: {
      replace: true,
    },
  };

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
    if (!this.currentUser.performsNonLearnerFunction) {
      this.router.replaceWith('/four-oh-four');
    }
  }

  model() {
    return this.dataLoader.loadSchoolsForLearnerGroups();
  }
}
