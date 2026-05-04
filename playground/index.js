console.log('[DEBUG] Wrapper entry: starting');
try {
  console.log('[DEBUG] Wrapper entry: about to import expo-router/entry');
  require('expo-router/entry');
  console.log('[DEBUG] Wrapper entry: expo-router/entry imported successfully');
} catch (e) {
  console.error('[DEBUG] Wrapper entry: CRASH during import', e.message, e.stack);
  throw e;
}
console.log('[DEBUG] Wrapper entry: finished');
