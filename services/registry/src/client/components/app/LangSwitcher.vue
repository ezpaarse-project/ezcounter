<script setup lang="ts">
  import { mdiTranslate } from '@mdi/js';
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';

  import enFlag from '../../assets/locales/en.svg';
  import frFlag from '../../assets/locales/fr.svg';

  const { locale } = useI18n();

  const langs = [
    {
      flag: enFlag,
      text: 'English',
      value: 'en',
    },
    {
      flag: frFlag,
      text: 'Français',
      value: 'fr',
    },
  ];

  const current = computed(
    () => langs.find(({ value }) => value === locale.value) ?? langs[0]
  );
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn :icon="mdiTranslate" v-bind="props"> </v-btn>
    </template>

    <v-list>
      <v-list-item
        v-for="lang in langs"
        :key="lang.value"
        :title="lang.text"
        :active="lang.value === current.value"
        @click="locale = lang.value"
      >
        <template #prepend>
          <img :src="lang.flag" width="32px" class="mr-2" />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
