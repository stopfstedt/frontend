import Component from '@glimmer/component';
import { restartableTask } from 'ember-concurrency';
import { on } from '@ember/modifier';
import perform from 'ember-concurrency/helpers/perform';

export default class CopyButtonComponent extends Component {
  copy = restartableTask(async () => {
    await navigator.clipboard.writeText(this.args.getClipboardText());
    if (this.args.success) {
      this.args.success();
    }
  });
  <template>
    <button
      type="button"
      class="copy-btn"
      data-test-copy-button
      ...attributes
      {{on "click" (perform this.copy)}}
    >
      {{yield}}
    </button>
  </template>
}
