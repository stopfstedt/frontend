import { service } from '@ember/service';
import Route from '@ember/routing/route';

export default class CourseVisualizeVocabularyRoute extends Route {
  @service store;
  @service currentUser;

  async model(params) {
    const course = await this.store.findRecord('course', params.course_id);
    const vocabulary = await this.store.findRecord('vocabulary', params.vocabulary_id);

    return { course, vocabulary };
  }

  async afterModel(model) {
    const { course, vocabulary } = model;
    await course.school;
    await vocabulary.terms;
    const sessions = await course.sessions;
    await Promise.all(sessions.map(async (s) => await s.terms));
  }

  beforeModel(transition) {
    this.currentUser.requireNonLearner(transition);
  }
}
