import { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  setupMainInterval,
  setupConnectedInterval,
  type HeartbeatSender,
} from './sender';

const FREQUENCY = {
  // self: 2 seconds
  self: 2 * 1000,

  connected: {
    // min: 5 seconds
    min: 5 * 1000,
    // max: 5 mins
    max: 5 * 60 * 1000,
  },
};

beforeEach(() => {
  vi.useFakeTimers();
});

describe('Main heartbeat (setupMainInterval)', () => {
  test('should send main heartbeat', () => {
    let hasFired = false;

    const sender: HeartbeatSender = new EventEmitter();
    sender.on('send:main', () => {
      hasFired = true;
    });

    setupMainInterval(sender, FREQUENCY);

    vi.advanceTimersToNextTimer();
    expect(hasFired).toBe(true);
  });
});

describe('Connected heartbeats (setupConnectedInterval)', () => {
  test('should send connected heartbeat', () => {
    let hasFired: string | undefined;

    const sender: HeartbeatSender = new EventEmitter();
    sender.on('send:connected', (key) => {
      hasFired = key;
    });

    setupConnectedInterval(sender, FREQUENCY, 'foobar');

    vi.advanceTimersToNextTimer();
    expect(hasFired).toBe('foobar');
  });
});

afterEach(() => {
  vi.useRealTimers();
});
