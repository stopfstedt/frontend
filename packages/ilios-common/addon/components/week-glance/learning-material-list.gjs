import FaIcon from 'ilios-common/components/fa-icon';
import t from 'ember-intl/helpers/t';
import { LinkTo } from '@ember/routing';
import LearningMaterialListItem from 'ilios-common/components/week-glance/learning-material-list-item';
<template>
  <div class="week-glance-learning-materials" data-test-learning-materials>
    {{#if @preworkEvents}}
      <ul class="prework" data-test-prework>
        {{#each @preworkEvents as |event|}}
          <li data-test-prework-event>
            <FaIcon @title={{t "general.preWork"}} @icon="person-chalkboard" />
            <LinkTo @route="events" @model={{event.slug}}>
              {{event.name}}
            </LinkTo>
            <ul>
              {{#each event.learningMaterials as |lm index|}}
                <LearningMaterialListItem
                  @event={{@event}}
                  @lm={{lm}}
                  @index={{index}}
                  @showLink={{false}}
                  data-test-prework-learning-material
                />
              {{/each}}
            </ul>
          </li>
        {{/each}}
      </ul>
    {{/if}}
    <ul>
      {{#each @learningMaterials as |lm index|}}
        <LearningMaterialListItem
          @event={{@event}}
          @lm={{lm}}
          @index={{index}}
          @showLink={{true}}
          data-test-learning-material
        />
      {{/each}}
    </ul>
  </div>
</template>
