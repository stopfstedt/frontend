import Component from '@glimmer/component';
import { service } from '@ember/service';
import { hash, all, filter } from 'rsvp';
import { dropTask, restartableTask, timeout } from 'ember-concurrency';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { DateTime } from 'luxon';
import { findById, sortBy } from 'ilios-common/utils/array-helpers';

export default class SessionCopyComponent extends Component {
  @service store;
  @service flashMessages;
  @service permissionChecker;

  @tracked selectedYear;
  @tracked selectedCourseId;
  @tracked years;
  @tracked allCourses;

  setup = restartableTask(async (element, [session]) => {
    if (!session) {
      return;
    }
    const course = await session.course;
    const school = await course.school;
    const { years, schoolCourses } = await hash({
      years: this.store.findAll('academic-year'),
      schoolCourses: this.store.query('course', {
        filters: {
          school: school.id,
        },
      }),
    });
    const now = DateTime.now();
    const thisYear = now.year;
    this.years = years
      .map((year) => Number(year.id))
      .filter((year) => year >= thisYear - 1)
      .sort();
    this.allCourses = await filter(schoolCourses, async (co) => {
      return this.permissionChecker.canCreateSession(co);
    });
  });

  get bestSelectedYear() {
    if (this.selectedYear) {
      return this.selectedYear;
    }

    return this.years[0];
  }

  get courses() {
    if (!this.allCourses) {
      return null;
    }
    return sortBy(
      this.allCourses.filter((course) => course.year === this.bestSelectedYear),
      'title',
    );
  }

  get bestSelectedCourse() {
    if (this.selectedCourseId) {
      const course = findById(this.courses, this.selectedCourseId);
      if (course) {
        return course;
      }
    }

    return this.courses[0];
  }

  @action
  changeSelectedYear(event) {
    this.selectedCourseId = null;
    this.selectedYear = Number(event.target.value);
  }

  @action
  changeSelectedCourseId(event) {
    this.selectedCourseId = event.target.value;
  }

  save = dropTask(async () => {
    await timeout(10);
    const sessionToCopy = this.args.session;
    const newCourse = this.bestSelectedCourse;
    const toSave = [];

    const session = this.store.createRecord(
      'session',
      sessionToCopy.getProperties(
        'title',
        'description',
        'attireRequired',
        'equipmentRequired',
        'supplemental',
        'attendanceRequired',
        'instructionalNotes',
      ),
    );

    session.set('course', newCourse);
    session.set('meshDescriptors', await sessionToCopy.meshDescriptors);
    session.set('terms', await sessionToCopy.terms);
    session.set('sessionType', await sessionToCopy.sessionType);

    const ilmToCopy = await sessionToCopy.ilmSession;
    if (ilmToCopy) {
      const ilm = this.store.createRecord(
        'ilmSession',
        ilmToCopy.getProperties('hours', 'dueDate'),
      );
      ilm.set('session', session);
      toSave.push(ilm);
    }

    const learningMaterialsToCopy = await sessionToCopy.learningMaterials;
    for (let i = 0; i < learningMaterialsToCopy.length; i++) {
      const learningMaterialToCopy = learningMaterialsToCopy.slice()[i];
      const lm = await learningMaterialToCopy.learningMaterial;
      const learningMaterial = this.store.createRecord(
        'session-learning-material',
        learningMaterialToCopy.getProperties('notes', 'required', 'publicNotes', 'position'),
      );
      learningMaterial.set('learningMaterial', lm);
      learningMaterial.set('session', session);
      toSave.push(learningMaterial);
    }

    const originalCourse = await sessionToCopy.course;
    if (newCourse.id === originalCourse.id) {
      const postrequisiteToCopy = await sessionToCopy.postrequisite;
      session.set('postrequisite', postrequisiteToCopy);
    }

    // save the session first to fill out relationships with the session id
    await session.save();
    await await all(toSave.map((o) => o.save()));

    //parse objectives last because it is a many2many relationship
    //and ember data tries to save it too soon
    const relatedSessionObjectives = await sessionToCopy.sessionObjectives;
    const sessionObjectivesToCopy = sortBy(relatedSessionObjectives, 'id');
    for (let i = 0, n = sessionObjectivesToCopy.length; i < n; i++) {
      const sessionObjectiveToCopy = sessionObjectivesToCopy[i];
      const meshDescriptors = await sessionObjectiveToCopy.meshDescriptors;
      const terms = await sessionObjectiveToCopy.terms;
      const sessionObjective = this.store.createRecord('session-objective', {
        session,
        position: sessionObjectiveToCopy.position,
        title: sessionObjectiveToCopy.title,
      });
      sessionObjective.set('meshDescriptors', meshDescriptors);
      sessionObjective.set('terms', terms);
      await sessionObjective.save();
    }
    this.flashMessages.success('general.copySuccess');
    return this.args.visit(session);
  });
}
