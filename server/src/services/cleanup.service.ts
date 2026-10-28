import { expireStalePayments } from './order.service.js';
import { CLEANUP_INTERVAL_MS } from '../utils/constants.js';

export function startCleanup() {
  const run = () => {
    expireStalePayments().catch((err) => console.error('cleanup failed', err));
  };
  run();
  const timer = setInterval(run, CLEANUP_INTERVAL_MS);
  timer.unref?.();
}
