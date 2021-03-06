import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Service from '@ember/service';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import { component } from 'ilios/tests/pages/components/login-form';

module('Integration | Component | login-form', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(hbs`<LoginForm />`);
    assert.equal(component.errors.length, 0);
    assert.ok(component.form.isPresent);
    assert.equal(component.form.username.label, 'Username:');
    assert.equal(component.form.username.value, '');
    assert.equal(component.form.password.label, 'Password:');
    assert.equal(component.form.password.value, '');
    await a11yAudit(this.element);
    assert.ok(true, 'no a11y errors found!');
  });

  test('no account exists error message', async function (assert) {
    const accountName = 'Al';
    this.set('account', accountName);
    this.set('error', true);
    await render(
      hbs`<LoginForm @noAccountExistsError={{this.error}} @noAccountExistsAccount={{this.account}} />`
    );
    assert.equal(component.errors.length, 1);
    assert.equal(
      component.errors[0].text,
      `Your account ${accountName} does not match any user records in Ilios. If you need further assistance, please contact your school’s Ilios administrator.`
    );
    assert.notOk(component.form.isPresent);
  });

  test('submit and fail', async function (assert) {
    const username = 'Foo';
    const password = 'Bar';
    const sessionMock = class extends Service {
      authenticate() {
        const err = new Error();
        err.json = {
          errors: ['badCredentials'],
        };
        throw err;
      }
    };
    this.owner.register('service:session', sessionMock);
    await render(hbs`<LoginForm />`);
    assert.equal(component.errors.length, 0);
    await component.form.username.set(username);
    await component.form.password.set(password);
    await component.form.submit();
    assert.equal(component.errors.length, 1);
    assert.equal(component.errors[0].text, 'Incorrect username or password');
  });

  test('submit and succeed', async function (assert) {
    assert.expect(4);
    const username = 'Foo';
    const password = 'Bar';
    const sessionMock = class extends Service {
      authenticate() {
        assert.equal(arguments[1].username, username);
        assert.equal(arguments[1].password, password);
      }
    };
    this.owner.register('service:session', sessionMock);
    await render(hbs`<LoginForm />`);
    assert.equal(component.errors.length, 0);
    await component.form.username.set(username);
    await component.form.password.set(password);
    await component.form.submit();
    assert.equal(component.errors.length, 0);
  });

  test('submit by pressing enter in username field', async function (assert) {
    assert.expect(2);
    const username = 'Foo';
    const password = 'Bar';
    const sessionMock = class extends Service {
      authenticate() {
        assert.equal(arguments[1].username, username);
        assert.equal(arguments[1].password, password);
      }
    };
    this.owner.register('service:session', sessionMock);
    await render(hbs`<LoginForm />`);
    await component.form.username.set(username);
    await component.form.password.set(password);
    await component.form.username.submit();
  });

  test('submit by pressing enter in password field', async function (assert) {
    assert.expect(2);
    const username = 'Foo';
    const password = 'Bar';
    const sessionMock = class extends Service {
      authenticate() {
        assert.equal(arguments[1].username, username);
        assert.equal(arguments[1].password, password);
      }
    };
    this.owner.register('service:session', sessionMock);
    await render(hbs`<LoginForm />`);
    await component.form.username.set(username);
    await component.form.password.set(password);
    await component.form.password.submit();
  });
});
