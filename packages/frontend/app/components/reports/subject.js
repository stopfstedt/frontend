import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { TrackedAsyncData } from 'ember-async-data';

export default class ReportsSubjectComponent extends Component {
  @service currentUser;
  @service preserveScroll;
  @service reporting;
  @service store;
  @tracked myReportEditorOn = false;

  get reportDescriptionPromise() {
    return this.reporting.buildReportDescription(
      this.args.report.subject,
      this.args.report.prepositionalObject,
      this.args.report.prepositionalObjectTableRowId,
      this.school,
    );
  }

  @cached
  get allSchools() {
    return new TrackedAsyncData(this.store.findAll('school'));
  }

  get schoolsById() {
    if (!this.allSchools.isResolved) {
      return null;
    }

    const rhett = {};
    this.allSchools.value.forEach((school) => {
      rhett[school.id] = school;
    });

    return rhett;
  }

  get school() {
    if (this.args.report.school) {
      const schoolId = this.args.report.belongsTo('school').id();

      return this.schoolsById[schoolId];
    }

    return null;
  }
}
