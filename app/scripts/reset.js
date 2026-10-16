import { resetStore, initStore, describeStore } from '../src/db.js';

await resetStore();
const { seededStaff } = await initStore();
console.log(`Store reset (${describeStore()}).`);
console.log(seededStaff
  ? 'Staff account seeded.'
  : 'No staff seeded (set ADMIN_HANDLE/ADMIN_PASSWORD).');
