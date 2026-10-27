/// <reference types="@fastify/vue/virtual" />
import type { RouteContext as _RouteContext } from '@fastify/vue';
import type { UseHeadInput as _UseHeadInput } from '@unhead/vue';
import type { App as _App } from 'vue';
import type { Router as _Router } from 'vue-router';

declare global {
  type RouteContext = _RouteContext;
  type UseHeadInput = _UseHeadInput;
  type App = _App;
  type Router = _Router;
}

// App-specific store types, augmenting the empty $app/stores module
declare module '$app/stores' {}
