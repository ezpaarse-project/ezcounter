import messages from '@intlify/unplugin-vue-i18n/messages';
import { createI18n } from 'vue-i18n';
import { en, fr } from 'vuetify/locale';

export default createI18n({
  fallbackLocale: 'en',
  locale: 'en',
  messages: {
    en: {
      $vuetify: en,
      ...messages?.en,
    },
    fr: {
      $vuetify: fr,
      ...messages?.fr,
    },
  },
});
