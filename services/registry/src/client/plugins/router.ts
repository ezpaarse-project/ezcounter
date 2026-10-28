import { createRouter, createWebHistory } from 'vue-router';
import { handleHotUpdate, routes } from 'vue-router/auto-routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

// oxlint-disable-next-line import/no-default-export
export default router;
