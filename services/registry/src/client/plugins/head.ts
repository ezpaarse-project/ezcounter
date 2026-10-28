import { createHead } from '@unhead/vue/client';

export default createHead({
  init: [
    {
      htmlAttrs: { lang: 'en' },
      title: 'Home',
      titleTemplate: '%s | ezCOUNTER Registry',
    },
  ],
});
