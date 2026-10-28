import { createApp } from 'vue';

// oxlint-disable-next-line import/no-unassigned-import
import './style.css';
import App from './App.vue';
import router from './plugins/router.ts';
import vuetify from './plugins/vuetify.ts';

createApp(App).use(router).use(vuetify).mount('#app');
