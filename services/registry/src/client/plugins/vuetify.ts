// oxlint-disable-next-line import/no-unassigned-import
import 'vuetify/styles';
import { useI18n } from 'vue-i18n';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';

import i18n from './i18n.ts';

export default createVuetify({
  icons: {
    aliases,
    defaultSet: 'mdi',
    sets: {
      mdi,
    },
  },

  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },

  theme: {
    themes: {
      dark: {
        colors: {
          primary: '#273582',
        },
      },
      light: {
        colors: {
          primary: '#273582',
        },
      },
    },

    transition: true,
  },
});
