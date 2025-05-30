import Component from '@glimmer/component';
import { service } from '@ember/service';

export default class YupValidationMessage extends Component {
  @service intl;
  get messages() {
    return (
      this.args.validationErrors?.map(({ messageKey, values }) => {
        if (!values) {
          values = {};
        }
        if (this.args.description) {
          values.description = this.args.description;
        } else {
          values.description = this.intl.t('errors.description');
        }

        return this.intl.t(messageKey, values);
      }) ?? []
    );
  }
  <template>
    {{#each this.messages as |m|}}
      <span class="validation-error-message" data-test-validation-error-message ...attributes>
        {{m}}
      </span>
    {{/each}}
  </template>
}
