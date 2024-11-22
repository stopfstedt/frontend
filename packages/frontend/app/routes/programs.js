import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProgramsRoute extends Route {
  @service session;
  @service store;
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
    return this.store.findAll('school', {
      include: 'programs.programYears.cohort',
      reload: true,
    });
  }
}
