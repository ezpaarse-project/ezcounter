<script lang="ts">
// @ts-expect-error re-exporting default from virtual module
// oxlint-disable-next-line import/no-default-export
export { default } from '$app/router.vue';

export const mount = '#root';

export function scrollBehavior(): { top: number; left: number } {
  // Always scroll to the top
  return { left: 0, top: 0 };
}

export function configure({ app, router }: { app: App; router: Router }): void {
  // Use this to configure/extend your Vue app and router instance
}
</script>
