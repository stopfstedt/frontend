import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isPresent } from '@ember/utils';
import { dropTask } from 'ember-concurrency';
import { all } from 'rsvp';
import { ValidateIf } from 'class-validator';
import { TrackedAsyncData } from 'ember-async-data';
import {
  validatable,
  AfterDate,
  Custom,
  IsInt,
  Gte,
  Lte,
  NotBlank,
} from 'ilios-common/decorators/validation';
import { findById } from 'ilios-common/utils/array-helpers';

@validatable
export default class CurriculumInventorySequenceBlockOverviewComponent extends Component {
  @service intl;
  @service store;

  @tracked childSequenceOrder;
  @tracked description;
  @tracked isEditingDatesAndDuration = false;
  @tracked isEditingMinMax = false;
  @tracked isManagingSessions = false;
  @tracked @NotBlank() @IsInt() @Gte(0) minimum;
  @tracked
  @NotBlank()
  @IsInt()
  @Gte(0)
  @Custom('validateMaximumCallback', 'validateMaximumMessageCallback')
  maximum;
  @tracked orderInSequence;
  @tracked required;
  @tracked
  @NotBlank()
  @IsInt()
  @Custom('validateDurationCallback', 'validateDurationMessageCallback')
  @Lte(1200)
  duration;
  @tracked
  @ValidateIf((o) => o.hasZeroDuration || o.linkedCourseIsClerkship)
  @NotBlank()
  startDate;
  @tracked
  @ValidateIf((o) => o.startDate)
  @NotBlank()
  @AfterDate('startDate', { granularity: 'day' })
  endDate;
  @tracked selectedCourse;
  @tracked
  @Custom('validateStartingEndingLevelCallback', 'validateStartingLevelMessageCallback')
  selectedStartingAcademicLevel;
  @tracked
  @Custom('validateStartingEndingLevelCallback', 'validateEndingLevelMessageCallback')
  selectedEndingAcademicLevel;

  constructor() {
    super(...arguments);
    this.required = this.args.sequenceBlock.required.toString();
    this.duration = this.args.sequenceBlock.duration;
    this.startDate = this.args.sequenceBlock.startDate;
    this.endDate = this.args.sequenceBlock.endDate;
    this.childSequenceOrder = this.args.sequenceBlock.childSequenceOrder.toString();
    this.orderInSequence = this.args.sequenceBlock.orderInSequence;
    this.minimum = this.args.sequenceBlock.minimum;
    this.maximum = this.args.sequenceBlock.maximum;
    this.description = this.args.sequenceBlock.description;
  }

  @cached
  get reportData() {
    return new TrackedAsyncData(this.args.sequenceBlock.report);
  }

  get report() {
    return this.reportData.isResolved ? this.reportData.value : null;
  }

  @cached
  get academicLevelsData() {
    return new TrackedAsyncData(this.report?.academicLevels);
  }

  get academicLevels() {
    return this.academicLevelsData.isResolved ? this.academicLevelsData.value : [];
  }

  @cached
  get startingAcademicLevelData() {
    return new TrackedAsyncData(this.args.sequenceBlock.startingAcademicLevel);
  }

  get startingAcademicLevel() {
    return this.startingAcademicLevelData.isResolved ? this.startingAcademicLevelData.value : null;
  }

  @cached
  get endingAcademicLevelData() {
    return new TrackedAsyncData(this.args.sequenceBlock.endingAcademicLevel);
  }

  get endingAcademicLevel() {
    return this.endingAcademicLevelData.isResolved ? this.endingAcademicLevelData.value : null;
  }

  @cached
  get courseData() {
    return new TrackedAsyncData(this.args.sequenceBlock.course);
  }

  get course() {
    return this.courseData.isResolved ? this.courseData.value : null;
  }

  get linkedCourseIsClerkship() {
    if (!this.course) {
      return false;
    }
    return !!this.course.belongsTo('clerkshipType').id();
  }

  @cached
  get linkableCourseData() {
    return new TrackedAsyncData(this.getLinkableCourses(this.report, this.course));
  }

  get linkableCourses() {
    return this.linkableCourseData.isResolved ? this.linkableCourseData.value : [];
  }

  /**
   * Returns a list of courses that can be linked to this sequence block.
   */
  async getLinkableCourses(report, course) {
    if (!report) {
      return [];
    }
    const program = await report.program;
    const schoolId = program.belongsTo('school').id();
    const allLinkableCourses = await this.store.query('course', {
      filters: {
        published: true,
        school: [schoolId],
        year: report.get('year'),
      },
    });
    const linkedCourses = await report.getLinkedCourses();
    // Filter out all courses that are linked to (sequence blocks in) this report.
    const linkableCourses = allLinkableCourses.filter((course) => {
      return !linkedCourses.includes(course);
    });
    // Always add the currently linked course to this list, if existent.
    if (isPresent(course)) {
      linkableCourses.push(course);
    }

    return linkableCourses;
  }

  @cached
  get sessionsData() {
    return new TrackedAsyncData(this.getSessions(this.course));
  }

  get sessions() {
    return this.sessionsData.isResolved ? this.sessionsData.value : [];
  }

  /**
   * Returns a list of published sessions that belong to a given course.
   */
  async getSessions(course) {
    if (!course) {
      return [];
    }
    return await this.store.query('session', {
      filters: {
        course: course.id,
        published: true,
      },
    });
  }

  @cached
  get linkedSessionsData() {
    return new TrackedAsyncData(this.args.sequenceBlock.sessions);
  }

  get linkedSessions() {
    return this.linkedSessionsData.isResolved ? this.linkedSessionsData.value : [];
  }

  @cached
  get excludedSessionsData() {
    return new TrackedAsyncData(this.args.sequenceBlock.excludedSessions);
  }

  get excludedSessions() {
    return this.excludedSessionsData.isResolved ? this.excludedSessionsData.value : [];
  }

  get dataForSessionsManagerLoaded() {
    return (
      this.sessionsData.isResolved &&
      this.linkedSessionsData.isResolved &&
      this.excludedSessionsData.isResolved
    );
  }

  @cached
  get parentData() {
    return new TrackedAsyncData(this.args.sequenceBlock.parent);
  }

  get parent() {
    return this.parentData.isResolved ? this.parentData.value : null;
  }

  @cached
  get selfAndSiblingsData() {
    return new TrackedAsyncData(this.getSelfAndSiblings(this.parent));
  }

  get selfAndSiblings() {
    return this.selfAndSiblingsData.isResolved ? this.selfAndSiblingsData.value : [];
  }

  async getSelfAndSiblings(parent) {
    if (!parent) {
      return [this.args.sequenceBlock];
    }
    return await parent.children;
  }

  get isInOrderedSequence() {
    return this.parent && this.parent.isOrdered;
  }

  get orderInSequenceOptions() {
    const rhett = [];
    for (let i = 0, n = this.selfAndSiblings.length; i < n; i++) {
      const num = i + 1;
      rhett.push(num);
    }
    return rhett;
  }

  get hasZeroDuration() {
    const num = Number(this.duration);
    if (Number.isNaN(num)) {
      return false;
    }
    return 0 === num;
  }

  get requiredLabel() {
    switch (this.required) {
      case '1':
        return this.intl.t('general.required');
      case '2':
        return this.intl.t('general.optionalElective');
      case '3':
        return this.intl.t('general.requiredInTrack');
      default:
        return null;
    }
  }

  get isElective() {
    return '2' === this.required;
  }

  get isSelective() {
    if (this.isElective) {
      return false;
    }
    const minimum = parseInt(this.minimum, 10);
    const maximum = parseInt(this.maximum, 10);
    return minimum > 0 && minimum !== maximum;
  }

  get childSequenceOrderLabel() {
    switch (this.childSequenceOrder) {
      case '1':
        return this.intl.t('general.ordered');
      case '2':
        return this.intl.t('general.unordered');
      case '3':
        return this.intl.t('general.parallel');
      default:
        return null;
    }
  }

  changeRequired = dropTask(async () => {
    this.args.sequenceBlock.required = parseInt(this.required, 10);
    if ('2' === this.required) {
      this.args.sequenceBlock.minimum = 0;
    }
    await this.args.sequenceBlock.save();
  });

  @action
  setRequired(required) {
    this.required = required;
    if ('2' === required) {
      this.minimum = 0;
    } else {
      this.minimum = this.args.sequenceBlock.minimum;
    }
  }

  @action
  revertRequiredChanges() {
    this.required = this.args.sequenceBlock.required.toString();
    this.minimum = this.args.sequenceBlock.minimum;
  }

  @action
  updateCourse(event) {
    const value = event.target.value;
    if (!value) {
      this.selectedCourse = {}; // Use an empty object here to indicate a user selection.
    } else {
      this.selectedCourse = findById(this.linkableCourses, value);
    }
  }

  @action
  async revertCourseChanges() {
    this.selectedCourse = null;
  }

  @action
  async saveCourse() {
    const oldCourse = await this.args.sequenceBlock.course;
    if (oldCourse !== this.selectedCourse) {
      this.args.sequenceBlock.set('sessions', []);
      this.args.sequenceBlock.set('excludedSessions', []);
    }
    this.args.sequenceBlock.set('course', this.selectedCourse.id ? this.selectedCourse : null);
    await this.args.sequenceBlock.save();
  }

  changeTrack = dropTask(async (value) => {
    this.args.sequenceBlock.set('track', value);
    await this.args.sequenceBlock.save();
  });

  saveDescription = dropTask(async () => {
    this.args.sequenceBlock.set('description', this.description);
    await this.args.sequenceBlock.save();
  });

  @action
  revertDescriptionChanges() {
    this.description = this.args.sequenceBlock.get('description');
  }

  changeChildSequenceOrder = dropTask(async () => {
    this.args.sequenceBlock.set('childSequenceOrder', parseInt(this.childSequenceOrder, 10));
    const savedBlock = await this.args.sequenceBlock.save();
    const children = await savedBlock.get('children');
    await all(children.map((child) => child.reload()));
  });

  @action
  revertChildSequenceOrderChanges() {
    this.childSequenceOrder = this.args.sequenceBlock.get('childSequenceOrder').toString();
  }

  changeStartingAcademicLevel = dropTask(async () => {
    if (!this.selectedStartingAcademicLevel) {
      return;
    }
    if (this.selectedStartingAcademicLevel.id === this.startingAcademicLevel.id) {
      return;
    }
    this.addErrorDisplaysFor(['selectedStartingAcademicLevel']);
    const isValid = await this.isValid();
    if (!isValid) {
      return false;
    }
    this.args.sequenceBlock.set('startingAcademicLevel', this.selectedStartingAcademicLevel);
    await this.args.sequenceBlock.save();
    this.revertStartingAcademicLevelChanges();
  });

  @action
  setStartingAcademicLevel(event) {
    const id = event.target.value;
    this.selectedStartingAcademicLevel = findById(this.academicLevels, id);
  }

  @action
  revertStartingAcademicLevelChanges() {
    this.selectedStartingAcademicLevel = null;
  }

  changeEndingAcademicLevel = dropTask(async () => {
    if (!this.selectedEndingAcademicLevel) {
      return;
    }
    if (this.selectedEndingAcademicLevel.id === this.endingAcademicLevel.id) {
      return;
    }
    this.addErrorDisplaysFor(['selectedEndingAcademicLevel']);
    const isValid = await this.isValid();
    if (!isValid) {
      return false;
    }
    this.args.sequenceBlock.set('endingAcademicLevel', this.selectedEndingAcademicLevel);
    await this.args.sequenceBlock.save();
    this.revertEndingAcademicLevelChanges();
  });

  @action
  setEndingAcademicLevel(event) {
    const id = event.target.value;
    this.selectedEndingAcademicLevel = findById(this.academicLevels, id);
  }

  @action
  revertEndingAcademicLevelChanges() {
    this.selectedStartingAcademicLevel = null;
  }

  @action
  updateOrderInSequence(event) {
    this.orderInSequence = parseInt(event.target.value);
  }

  @action
  revertOrderInSequenceChanges() {
    this.orderInSequence = this.args.sequenceBlock.orderInSequence;
  }

  saveOrderInSequenceChanges = dropTask(async () => {
    if (this.orderInSequence === this.args.sequenceBlock.orderInSequence) {
      return;
    }

    this.args.sequenceBlock.set('orderInSequence', this.orderInSequence);
    const savedBlock = await this.args.sequenceBlock.save();
    const parent = await savedBlock.parent;
    const children = await parent.children;
    await all(children.map((child) => child.reload()));
  });

  @action
  editMinMax() {
    this.isEditingMinMax = true;
  }

  @action
  cancelMinMaxEditing() {
    this.minimum = this.args.sequenceBlock.minimum;
    this.maximum = this.args.sequenceBlock.maximum;
    this.isEditingMinMax = false;
  }

  @action
  toggleManagingSessions() {
    this.isManagingSessions = !this.isManagingSessions;
  }

  @action
  cancelManagingSessions() {
    this.isManagingSessions = false;
  }

  changeSessions = dropTask(async (sessions, excludedSessions) => {
    this.args.sequenceBlock.set('sessions', sessions);
    this.args.sequenceBlock.set('excludedSessions', excludedSessions);
    await this.args.sequenceBlock.save();
    this.isManagingSessions = false;
  });

  @action
  changeDescription(event) {
    this.description = event.target.value;
  }

  @action
  async saveOrCancelMinMax(ev) {
    const keyCode = ev.keyCode;
    if (13 === keyCode) {
      await this.saveMinMax.perform();
      return;
    }

    if (27 === keyCode) {
      this.isEditingMinMax = false;
    }
  }

  @action
  validateMaximumCallback() {
    const max = parseInt(this.maximum, 10) || 0;
    const min = parseInt(this.minimum, 10) || 0;
    return max >= min;
  }

  @action
  validateMaximumMessageCallback() {
    return this.intl.t('errors.greaterThanOrEqualTo', {
      gte: this.intl.t('general.minimum'),
      description: this.intl.t('general.maximum'),
    });
  }

  @action
  validateStartingEndingLevelCallback() {
    const startingAcademicLevel = this.selectedStartingAcademicLevel || this.startingAcademicLevel;
    const endingAcademicLevel = this.selectedEndingAcademicLevel || this.endingAcademicLevel;
    return endingAcademicLevel.level >= startingAcademicLevel.level;
  }

  @action
  validateEndingLevelMessageCallback() {
    return this.intl.t('errors.greaterThanOrEqualTo', {
      gte: this.intl.t('general.startLevel'),
      description: this.intl.t('general.endLevel'),
    });
  }

  @action
  validateStartingLevelMessageCallback() {
    return this.intl.t('errors.lessThanOrEqualTo', {
      lte: this.intl.t('general.endLevel'),
      description: this.intl.t('general.startLevel'),
    });
  }

  @action
  validateDurationCallback() {
    const duration = parseInt(this.duration, 10);
    return this.linkedCourseIsClerkship ? duration >= 1 : duration >= 0;
  }

  @action
  validateDurationMessageCallback() {
    return this.intl.t('errors.greaterThanOrEqualTo', {
      gte: this.linkedCourseIsClerkship ? 1 : 0,
      description: this.intl.t('general.duration'),
    });
  }

  saveMinMax = dropTask(async () => {
    this.addErrorDisplaysFor(['minimum', 'maximum']);
    const isValid = await this.isValid();
    if (!isValid) {
      return false;
    }
    this.args.sequenceBlock.minimum = this.minimum;
    this.args.sequenceBlock.maximum = this.maximum;

    await this.args.sequenceBlock.save();
    this.isEditingMinMax = false;
  });

  @action
  changeStartDate(startDate) {
    this.startDate = startDate;
  }

  @action
  changeEndDate(endDate) {
    this.endDate = endDate;
  }

  saveDuration = dropTask(async () => {
    this.addErrorDisplaysFor(['startDate', 'endDate', 'duration']);
    const isValid = await this.isValid();
    if (!isValid) {
      return false;
    }
    this.args.sequenceBlock.startDate = this.startDate;
    this.args.sequenceBlock.endDate = this.endDate;
    this.args.sequenceBlock.duration = this.duration;
    await this.args.sequenceBlock.save();
    this.isEditingDatesAndDuration = false;
  });

  @action
  cancelDurationEditing() {
    this.startDate = this.args.sequenceBlock.startDate;
    this.endDate = this.args.sequenceBlock.endDate;
    this.duration = this.args.sequenceBlock.duration;
    this.isEditingDatesAndDuration = false;
  }

  @action
  async saveOrCancelDuration(ev) {
    const keyCode = ev.keyCode;
    if (13 === keyCode) {
      await this.saveDuration.perform();
      return;
    }

    if (27 === keyCode) {
      this.isEditingDatesAndDuration = false;
    }
  }
}
