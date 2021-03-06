import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { component } from 'ilios/tests/pages/components/school-competencies-collapsed';

module('Integration | Component | school competencies collapsed', function (hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  test('it renders', async function (assert) {
    const school = this.server.create('school');
    const domain = this.server.create('competency', { school });
    const domain2 = this.server.create('competency', { school });
    this.server.create('competency', { school });
    this.server.create('competency', { school, parent: domain2 });
    this.server.createList('competency', 3, { school, parent: domain });
    const schoolModel = await this.owner.lookup('service:store').find('school', school.id);

    this.set('school', schoolModel);
    await render(hbs`<SchoolCompetenciesCollapsed @school={{this.school}} @expand={{noop}} />`);

    assert.equal(component.expandButton.text, 'Competencies (3/4)');
    assert.equal(component.domains.length, 3);
    assert.equal(component.domains[0].title, 'competency 0');
    assert.equal(component.domains[0].summary, 'There are 3 competencies');
    assert.equal(component.domains[1].title, 'competency 1');
    assert.equal(component.domains[1].summary, 'There is 1 competency');
    assert.equal(component.domains[2].title, 'competency 2');
    assert.equal(component.domains[2].summary, 'There are 0 competencies');
  });

  test('it renders', async function (assert) {
    const school = this.server.create('school');
    const schoolModel = await this.owner.lookup('service:store').find('school', school.id);

    this.set('school', schoolModel);
    this.set('expand', () => {
      assert.ok(true);
    });
    await render(
      hbs`<SchoolCompetenciesCollapsed @school={{this.school}} @expand={{this.expand}} />`
    );
    await component.expandButton.click();
  });
});
