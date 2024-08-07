import Application from 'lti-course-manager/app';
import config from 'lti-course-manager/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import start from 'ember-exam/test-support/start';
import 'qunit-theme-ember/qunit.css';

setApplication(Application.create(config.APP));

setup(QUnit.assert);

start();
