<template>
  <h1>{{ message }}</h1>
</template>

<script setup lang="ts">
// import logo from '/assets/logo.svg';

const message = 'Welcome to @fastify/vue!';
</script>

<script lang="ts">
export function getMeta() {
  return {
    title: 'Welcome to @fastify/vue!',
  };
}
</script>
