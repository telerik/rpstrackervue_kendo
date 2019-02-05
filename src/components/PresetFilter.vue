<template>
  <div class="btn-group mr-2">
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      @click="onSelectPresetTap('my')"
    >My Items</button>
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      @click="onSelectPresetTap('open')"
    >Open Items</button>
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      @click="onSelectPresetTap('closed')"
    >Done Items</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PresetType } from '@/core/models/domain/types';

@Component
export default class PresetFilter extends Vue {
  public onSelectPresetTap(preset: PresetType) {
    this.$emit('onPresetSelected', preset);
  }
}
</script>
