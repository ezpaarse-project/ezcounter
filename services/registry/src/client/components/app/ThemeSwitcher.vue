<script setup lang="ts">
  import { mdiBrightness4, mdiBrightness6 } from '@mdi/js';
  import { useTheme } from 'vuetify';

  const { current, change } = useTheme();

  function toggleTheme(): void {
    change(current.value.dark ? 'light' : 'dark');
  }
</script>

<template>
  <v-btn
    :icon="current.dark ? mdiBrightness6 : mdiBrightness4"
    @click="toggleTheme()"
  />
</template>
