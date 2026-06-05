import { ZapFinding } from '../tools/zap';

export interface NormalizedVulnerability {
  tool_name: string;
  category: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: 'high' | 'medium' | 'low';
  asset_type: string;
  asset_value: string;
  description: string;
  impact?: string;
  remediation?: string;
}

export function normalizeZapFindings(
  findings: ZapFinding[],
): NormalizedVulnerability[] {
  const vulnerabilities: NormalizedVulnerability[] = [];

  for (const finding of findings) {
    const uniqueUrls = new Set<string>(finding.instances.map((i) => i.uri));
    for (const url of uniqueUrls) {
      vulnerabilities.push({
        tool_name: 'zap',
        category: mapZapCategory(finding.pluginid),
        title: finding.alert || finding.name,
        severity: mapZapSeverity(finding.riskcode),
        confidence: mapZapConfidence(finding.confidence),
        asset_type: 'url',
        asset_value: url,
        description: finding.desc,
        impact: finding.riskdesc,
        remediation: finding.solution,
      });
    }
  }
  return vulnerabilities;
}

function mapZapSeverity(riskcode: string): NormalizedVulnerability['severity'] {
  const map: Record<string, NormalizedVulnerability['severity']> = {
    '0': 'info',
    '1': 'low',
    '2': 'medium',
    '3': 'high',
    '4': 'critical',
  };
  return map[riskcode] || 'info';
}

function mapZapConfidence(
  confidence: string,
): NormalizedVulnerability['confidence'] {
  const confidenceLower = confidence.toLowerCase();
  if (confidence.includes('high')) {
    return 'high';
  }
  if (confidence.includes('medium')) {
    return 'medium';
  }
  return 'low';
}

function mapZapCategory(pluginid: string): string {
  const categoryMap: Record<string, string> = {
    '10021': 'X-Content-Type-Options Header',
    '10023': 'Information Disclosure',
    '10027': 'Information Disclosure',
    '10038': 'Content Security Policy',
    '10096': 'Timestamp Disclosure',
    '10098': 'Cross-Domain Misconfiguration',
    '10109': 'Authentication',
    '10202': 'Missing Anti-clickjacking Header',
    '40012': 'Cross Site Scripting',
    '40014': 'Cross Site Scripting',
    '40016': 'Cross Site Scripting',
    '40017': 'Cross Site Scripting',
    '90022': 'SQL Injection',
    '90033': 'Directory Browsing',
  };
  return categoryMap[pluginid] || 'Other';
}
