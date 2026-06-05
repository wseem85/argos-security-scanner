export const TOOLS_BY_SCAN_TYPE: Record<string, string[]> = {
  passive: ['zap'],
  active: ['zap', 'nikto'],
  full: ['zap', 'nikto', 'ffuf', 'nmap'],
};
// Record<string, string[]> creates an object type where each key is a string and each value is an array of strings
