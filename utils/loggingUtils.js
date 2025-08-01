export function patchConsole() {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  function logWithTimestamp(logger, args) {
    const timestamp = new Date().toISOString();
    logger(`[${timestamp}]`, ...args);
  }

  console.log = (...args) => logWithTimestamp(originalConsoleLog, args);
  console.error = (...args) => logWithTimestamp(originalConsoleError, args);
  console.warn = (...args) => logWithTimestamp(originalConsoleWarn, args);
}
