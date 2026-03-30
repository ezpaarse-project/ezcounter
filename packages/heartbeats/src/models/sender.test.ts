import { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  type HeartbeatSender,
  setupConnectedInterval,
  setupMainInterval,
} from './sender';

const FREQUENCY = {
  // Self: 2 seconds
  connected: {
    // Max: 5 mins
    max: 5 * 60 * 1000,
    // Min: 5 seconds
    min: 5 * 1000,
  },

  self: 2 * 1000,
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
    let firedEvent = '';

    const sender: HeartbeatSender = new EventEmitter();
    sender.on('send:connected', (key) => {
      firedEvent = key;
    });

    setupConnectedInterval(sender, FREQUENCY, 'foobar');

    vi.advanceTimersToNextTimer();
    expect(firedEvent).toBe('foobar');
  });
});

afterEach(() => {
  vi.useRealTimers();
});
