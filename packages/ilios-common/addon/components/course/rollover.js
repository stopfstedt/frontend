import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { validatable, Length, NotBlank } from 'ilios-common/decorators/validation';
import { dropTask, restartableTask, timeout } from 'ember-concurrency';
import { DateTime } from 'luxon';
import { filterBy, mapBy } from 'ilios-common/utils/array-helpers';

@validatable
export default class CourseRolloverComponent extends Component {
  @service fetch;
  @service store;
  @service flashMessages;
  @service iliosConfig;

  @Length(3, 200) @NotBlank() @tracked title;
  @NotBlank() @tracked selectedYear;
  @tracked years;
  @tracked course;
  @tracked selectedStartDate;
  @tracked skipOfferings = false;
  @tracked allCourses;
  @tracked selectedCohorts = [];
  @tracked academicYearCrossesCalendarYearBoundaries = false;

  constructor() {
    super(...arguments);
    let { month, year } = DateTime.now();
    year--; // start with the previous year
    if (month < 7) {
      // before July 1st (start of a new academic year) show the year before
      year--;
    }
    this.years = [];
    for (let i = 0; i < 6; i++) {
      this.years.push(year + i);
    }
  }

  get startDate() {
    return this.selectedStartDate ?? this.args.course.startDate;
  }

  get allowedWeekdays() {
    return [DateTime.fromJSDate(this.args.course.startDate).weekday];
  }

  load = restartableTask(async (event, [course]) => {
    if (!course) {
      return;
    }
    this.title = course.title;
    const school = course.belongsTo('school').id();
    this.academicYearCrossesCalendarYearBoundaries = await this.iliosConfig.itemFromConfig(
      'academicYearCrossesCalendarYearBoundaries',
    );
    this.allCourses = await this.store.query('course', {
      filters: {
        school,
      },
    });

    // set selectedYear to next valid year (or current if none found)
    const validYear = this.years.find((year) => !this.unavailableYears.includes(year));
    this.changeSelectedYear(validYear || this.years[0]);
  });

  @action
  changeTitle(newTitle) {
    this.title = newTitle;
  }
  @action
  addCohort(cohort) {
    this.selectedCohorts = [...this.selectedCohorts, cohort];
  }
  @action
  removeCohort(cohort) {
    this.selectedCohorts = this.selectedCohorts.filter((obj) => obj !== cohort);
  }

  @action
  updateStartDate(newStartDate) {
    // if a date is forced that isn't allowed
    this.selectedStartDate = newStartDate ? newStartDate : this.args.course.startDate;
  }

  save = dropTask(async () => {
    await timeout(1);
    this.addErrorDisplayForAllFields();
    const isValid = await this.isValid();
    if (!isValid) {
      return false;
    }
    const courseId = this.args.course.id;

    const selectedCohortIds = mapBy(this.selectedCohorts, 'id');

    const data = {
      year: this.selectedYear,
      newCourseTitle: this.title,
    };
    if (this.selectedStartDate) {
      data.newStartDate = DateTime.fromJSDate(this.selectedStartDate).toFormat('yyyy-LL-dd');
    }
    if (this.skipOfferings) {
      data.skipOfferings = true;
    }
    if (selectedCohortIds && selectedCohortIds.length) {
      data.newCohorts = selectedCohortIds;
    }

    const newCoursesObj = await this.fetch.postQueryToApi(`courses/${courseId}/rollover`, data);

    this.flashMessages.success('general.courseRolloverSuccess');
    this.store.pushPayload(newCoursesObj);
    const newCourse = this.store.peekRecord('course', newCoursesObj.data.id);

    return this.args.visit(newCourse);
  });

  get unavailableYears() {
    if (!this.allCourses) {
      return [];
    }
    const existingCoursesWithTitle = filterBy(this.allCourses, 'title', this.title.trim());
    return mapBy(existingCoursesWithTitle, 'year');
  }

  @action
  setSelectedYear(event) {
    this.changeSelectedYear(event.target.value);
  }

  @action
  changeSelectedYear(selectedYear) {
    this.selectedYear = Number(selectedYear);

    const from = DateTime.fromJSDate(this.args.course.startDate);

    this.selectedStartDate = DateTime.fromObject({
      hour: 0,
      minute: 0,
      weekYear: Number(selectedYear),
      weekNumber: from.weekNumber,
      weekday: from.weekday,
    }).toJSDate();
  }
}
