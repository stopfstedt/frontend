import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { TrackedAsyncData } from 'ember-async-data';
import { cached } from '@glimmer/tracking';
import { uniqueId, fn } from '@ember/helper';
import includes from 'ilios-common/helpers/includes';
import escapeRegExp from 'ilios-common/utils/escape-reg-exp';
import { on } from '@ember/modifier';
import FaIcon from 'ilios-common/components/fa-icon';
import t from 'ember-intl/helpers/t';
import isArray from 'ember-truth-helpers/helpers/is-array';
import sortBy from 'ilios-common/helpers/sort-by';
import LearnergroupTree0 from 'ilios-common/components/learnergroup-tree';
import LoadingSpinner from 'ilios-common/components/loading-spinner';

export default class LearnergroupTree extends Component {
  @service intl;

  get isRoot() {
    return this.args.isRoot ?? true;
  }

  @cached
  get childrenData() {
    return new TrackedAsyncData(this.args.learnerGroup.children);
  }

  get children() {
    return this.childrenData.isResolved ? this.childrenData.value : null;
  }

  get hasChildren() {
    return this.args.learnerGroup.hasMany('children').ids().length > 0;
  }

  get filterMatch() {
    if (this.args.filter && this.args.filter.length > 0) {
      const exp = new RegExp(escapeRegExp(this.args.filter), 'gi');
      return this.args.learnerGroup.filterTitle.match(exp) != null;
    }

    return true;
  }

  get isHidden() {
    return !this.filterMatch;
  }

  @action
  add(learnerGroup, ev) {
    this.args.add(learnerGroup, !(ev.ctrlKey || ev.shiftKey));
  }

  @action
  remove(learnerGroup, ev) {
    this.args.remove(learnerGroup, !(ev.ctrlKey || ev.shiftKey));
  }

  @action
  sortByTitle(learnerGroupA, learnerGroupB) {
    const locale = this.intl.get('locale');
    return learnerGroupA.title.localeCompare(learnerGroupB.title, locale, {
      numeric: true,
    });
  }
  <template>
    {{#let (uniqueId) as |templateId|}}
      <li
        hidden={{this.isHidden}}
        class="learnergroup-tree {{if this.hasChildren 'branch' 'leaf'}}"
        data-test-learnergroup-tree
        data-test-learnergroup-tree-root={{if this.isRoot "true" "false"}}
      >
        <input
          type="checkbox"
          aria-labelledby="learnergroup-label-{{templateId}}"
          checked={{includes @learnerGroup @selectedGroups}}
          {{on
            "click"
            (if
              (includes @learnerGroup @selectedGroups)
              (fn this.remove @learnerGroup)
              (fn this.add @learnerGroup)
            )
          }}
          data-test-checkbox
        />
        <button
          id="learnergroup-label-{{templateId}}"
          class="learnergroup-label"
          type="button"
          {{on
            "click"
            (if
              (includes @learnerGroup @selectedGroups)
              (fn this.remove @learnerGroup)
              (fn this.add @learnerGroup)
            )
          }}
          data-test-checkbox-title
        >
          {{@learnerGroup.title}}
        </button>
        {{#if @learnerGroup.needsAccommodation}}
          <FaIcon
            @icon="universal-access"
            @title={{t "general.accommodationIsRequiredForLearnersInThisGroup"}}
          />
        {{/if}}
        {{#if this.hasChildren}}
          <ul data-test-subgroups>
            {{#if (isArray this.children)}}
              {{#each (sortBy this.sortByTitle this.children) as |child|}}
                <LearnergroupTree0
                  @learnerGroup={{child}}
                  @selectedGroups={{@selectedGroups}}
                  @isRoot={{false}}
                  @filter={{@filter}}
                  @add={{@add}}
                  @remove={{@remove}}
                />
              {{/each}}
            {{else}}
              <li>
                <LoadingSpinner />
              </li>
            {{/if}}
          </ul>
        {{/if}}
      </li>
    {{/let}}
  </template>
}
