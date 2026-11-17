<template>
  <div class="panel kpi">
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value" :style="{ color: color }">
      {{ value }}<span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div class="kpi-sub">
      <slot>
        <span class="muted">{{ sub }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  unit?: string
  sub?: string
  color?: string
}>()
</script>

<style scoped>
.kpi {
  padding: 15px 18px;
}
.unit {
  font-size: 13px;
  font-weight: 500;
  margin-left: 3px;
  color: #9aa1b1;
}
.kpi-value {
  font-size: 26px;
}
</style>
