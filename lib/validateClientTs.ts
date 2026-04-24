export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  extracted: {
    name?: string;
    name_en?: string;
    domain?: string;
    whatsapp?: string;
  };
}

export function validateClientTs(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fillCount = (code.match(/\bFILL\b/g) ?? []).length;
  if (fillCount > 0) {
    errors.push(`${fillCount} FILL placeholder(s) remain — all must be replaced with real Hebrew content`);
  }

  const todoCount = (code.match(/\bTODO\b/gi) ?? []).length;
  if (todoCount > 0) {
    errors.push(`${todoCount} TODO placeholder(s) remain`);
  }

  if (!code.includes("export const CLIENT = {")) {
    errors.push("Missing 'export const CLIENT = {' declaration");
  }

  if (!code.includes("as const")) {
    warnings.push("Missing 'as const' at end of object");
  }

  const nameMatch    = code.match(/^\s*name:\s*["']([^"']+)["']/m);
  const nameEnMatch  = code.match(/name_en:\s*["']([^"']+)["']/);
  const domainMatch  = code.match(/domain:\s*["']([^"']+)["']/);
  const whatsappMatch = code.match(/whatsapp:\s*["']([^"']+)["']/);

  const nameEn  = nameEnMatch?.[1];
  const whatsapp = whatsappMatch?.[1];
  const domain  = domainMatch?.[1];

  if (nameEn && !/^[a-z0-9-]+$/.test(nameEn)) {
    errors.push(`name_en "${nameEn}" must be a URL slug: lowercase letters, numbers, and hyphens only`);
  }

  if (whatsapp && !/^972\d{9,10}$/.test(whatsapp)) {
    warnings.push(`whatsapp "${whatsapp}" should start with 972 followed by 9-10 digits`);
  }

  if (domain && domain.toLowerCase().includes("fill")) {
    errors.push("domain field still contains a placeholder value");
  }

  if (code.length < 3000) {
    warnings.push("Generated file is shorter than expected — may be missing page sections");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    extracted: {
      name:     nameMatch?.[1],
      name_en:  nameEn,
      domain,
      whatsapp,
    },
  };
}
