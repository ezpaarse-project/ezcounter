<script setup lang="ts">
  import { useI18n } from 'vue-i18n';

  import AppLangSwitcher from './components/app/LangSwitcher.vue';
  import AppNavigationDrawer from './components/app/NavigationDrawer.vue';
  import AppThemeSwitcher from './components/app/ThemeSwitcher.vue';

  const { t } = useI18n();
</script>

<template>
  <v-app>
    <v-layout>
      <v-app-bar :title="t('app.name')" color="primary">
        <template #append>
          <div class="d-flex ga-1">
            <AppLangSwitcher />
            <AppThemeSwitcher />
          </div>
        </template>
      </v-app-bar>

      <v-navigation-drawer>
        <AppNavigationDrawer />
      </v-navigation-drawer>

      <v-main>
        <v-container>
          <RouterView />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>
