import { service } from '@ember/service';
import Route from '@ember/routing/route';

export default class UsersRoute extends Route {
  @service session;
  @service dataLoader;
  @service currentUser;
  @service router;

  queryParams = {
    query: {
      replace: true,
    },

    searchTerms: {
      replace: true,
    },
  };

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');
    if (!this.currentUser.performsNonLearnerFunction) {
      this.router.replaceWith('/four-oh-four');
    }
  }

  async afterModel() {
    return this.dataLoader.loadSchoolsForLearnerGroups();
  }
}
