import { createApp } from 'vue';
// oxlint-disable-next-line import/no-unassigned-import
import 'unfonts.css';

import App from './App.vue';
import head from './plugins/head.ts';
import i18n from './plugins/i18n.ts';
import router from './plugins/router.ts';
import vuetify from './plugins/vuetify.ts';

const app = createApp(App);

app.use(router);
app.use(head);
app.use(i18n);
app.use(vuetify);

app.mount('#app');
