import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { component } from 'ilios/tests/pages/components/instructorgroup-header';
import a11yAudit from 'ember-a11y-testing/test-support/audit';

module('Integration | Component | instructorgroup header', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    const users = this.server.createList('user', 3);
    const school = this.server.create('school', { title: 'Medicine' });
    const instructorGroup = this.server.create('instructor-group', {
      title: 'lorem ipsum',
      school,
      users,
    });
    this.instructorGroup = await this.owner
      .lookup('service:store')
      .find('instructor-group', instructorGroup.id);
  });

  test('it renders', async function (assert) {
    this.set('instructorGroup', this.instructorGroup);
    this.set('canUpdate', true);

    await render(
      hbs`<InstructorgroupHeader @instructorGroup={{this.instructorGroup}} @canUpdate={{this.canUpdate}} />`
    );

    assert.equal(component.title.text, 'lorem ipsum');
    assert.ok(component.title.isEditable);
    assert.ok(component.members, 'Members: 3');
    assert.equal(component.breadcrumb.crumbs.length, 3);
    assert.equal(component.breadcrumb.crumbs[0].text, 'Instructor Groups');
    assert.equal(component.breadcrumb.crumbs[1].text, 'Medicine');
    assert.equal(component.breadcrumb.crumbs[2].text, 'lorem ipsum');
    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('it renders in read-only mode', async function (assert) {
    this.set('instructorGroup', this.instructorGroup);
    this.set('canUpdate', false);

    await render(
      hbs`<InstructorgroupHeader @instructorGroup={{this.instructorGroup}} @canUpdate={{this.canUpdate}} />`
    );

    assert.equal(component.title.text, 'lorem ipsum');
    assert.notOk(component.title.isEditable);
    assert.ok(component.members, 'Members: 3');
    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('change title', async function (assert) {
    const newTitle = 'foo bar';
    this.set('instructorGroup', this.instructorGroup);
    this.set('canUpdate', true);

    await render(
      hbs`<InstructorgroupHeader @instructorGroup={{this.instructorGroup}} @canUpdate={{this.canUpdate}} />`
    );

    assert.equal(component.title.text, 'lorem ipsum');
    await component.title.edit();
    assert.equal(component.title.value, 'lorem ipsum');
    await component.title.set(newTitle);
    await component.title.save();
    assert.equal(component.title.text, 'foo bar');
  });

  test('changing title fails if new title is too long', async function (assert) {
    this.set('instructorGroup', this.instructorGroup);
    this.set('canUpdate', true);

    await render(
      hbs`<InstructorgroupHeader @instructorGroup={{this.instructorGroup}} @canUpdate={{this.canUpdate}} />`
    );

    assert.equal(component.title.text, 'lorem ipsum');
    await component.title.edit();
    assert.equal(component.title.errors.length, 0);
    assert.equal(component.title.value, 'lorem ipsum');
    await component.title.set('01234567890'.repeat(1000));
    await component.title.save();
    assert.equal(component.title.errors.length, 1);
  });

  test('changing title fails if new title is too short', async function (assert) {
    this.set('instructorGroup', this.instructorGroup);
    this.set('canUpdate', true);

    await render(
      hbs`<InstructorgroupHeader @instructorGroup={{this.instructorGroup}} @canUpdate={{this.canUpdate}} />`
    );

    assert.equal(component.title.text, 'lorem ipsum');
    await component.title.edit();
    assert.equal(component.title.errors.length, 0);
    assert.equal(component.title.value, 'lorem ipsum');
    await component.title.set('AB');
    await component.title.save();
    assert.equal(component.title.errors.length, 1);
  });

  test('changing title fails if title is blank', async function (assert) {
    this.set('instructorGroup', this.instructorGroup);
    this.set('canUpdate', true);

    await render(
      hbs`<InstructorgroupHeader @instructorGroup={{this.instructorGroup}} @canUpdate={{this.canUpdate}} />`
    );

    assert.equal(component.title.text, 'lorem ipsum');
    await component.title.edit();
    assert.equal(component.title.errors.length, 0);
    assert.equal(component.title.value, 'lorem ipsum');
    await component.title.set('');
    await component.title.save();
    assert.equal(component.title.errors.length, 1);
  });

  test('cancel title changes', async function (assert) {
    this.set('instructorGroup', this.instructorGroup);
    this.set('canUpdate', true);

    await render(
      hbs`<InstructorgroupHeader @instructorGroup={{this.instructorGroup}} @canUpdate={{this.canUpdate}} />`
    );

    assert.equal(component.title.text, 'lorem ipsum');
    await component.title.edit();
    assert.equal(component.title.errors.length, 0);
    assert.equal(component.title.value, 'lorem ipsum');
    await component.title.set('foo bar');
    await component.title.cancel();
    assert.equal(component.title.text, 'lorem ipsum');
  });
});
