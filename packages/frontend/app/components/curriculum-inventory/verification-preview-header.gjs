import t from 'ember-intl/helpers/t';
<template>
  <div
    class="curriculum-inventory-verification-preview-header"
    id="toc"
    data-test-curriculum-inventory-verification-preview-header
    ...attributes
  >
    <div data-test-title class="title">
      <h2>
        {{t "general.verificationPreviewFor" name=@report.name}}
      </h2>
    </div>
  </div>
</template>
