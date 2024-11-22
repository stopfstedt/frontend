import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { filter } from 'rsvp';

export default class PendingUserUpdatesRoute extends Route {
  @service currentUser;
  @service permissionChecker;
  @service store;
  @service session;
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

  async model() {
    const allSchools = await this.store.findAll('school');
    const schools = await filter(allSchools, async (school) => {
      return this.permissionChecker.canUpdateUserInSchool(school);
    });
    const user = await this.currentUser.getModel();
    const primarySchool = await user.school;
    const allPendingUpdates = await this.store.findAll('pending-user-update', {
      include: 'user',
    });
    return { primarySchool, schools, allPendingUpdates };
  }
}
