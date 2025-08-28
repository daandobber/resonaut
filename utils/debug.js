// Simple toggles for runtime debug output around Pulse and Orbitones
export const DEBUG_PULSE = false; // set true to enable console logs
export const DEBUG_ORBITONE = false; // set true to enable console logs

export function dbgPulse(..._args) { /* no-op when DEBUG_PULSE === false */ }

export function dbgOrbitone(..._args) { /* no-op when DEBUG_ORBITONE === false */ }
