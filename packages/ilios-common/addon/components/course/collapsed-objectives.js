import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';

export default class CourseCollapsedObjectivesComponent extends Component {
  @tracked objectivesRelationship;

  load = restartableTask(async () => {
    this.objectivesRelationship = await this.args.course.courseObjectives;
  });

  get objectives() {
    return this.objectivesRelationship ? this.objectivesRelationship : [];
  }

  get objectivesWithParents() {
    return this.objectives.filter((objective) => {
      return objective.programYearObjectives.length > 0;
    });
  }

  get objectivesWithMesh() {
    return this.objectives.filter((objective) => {
      return objective.meshDescriptors.length > 0;
    });
  }

  get objectivesWithTerms() {
    return this.objectives.filter((objective) => {
      return objective.terms.length > 0;
    });
  }
}
