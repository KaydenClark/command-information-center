export function hasPrivacySensitiveContent(...parts) {
  let explicitlySensitive = false;
  const textParts = [];

  function collect(value) {
    if (value == null || value === false) return;
    if (typeof value === "string" || typeof value === "number") {
      textParts.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      if (
        value.money === true ||
        value.financial === true ||
        value.medical === true ||
        value.health === true ||
        value.sensitive === true
      ) {
        explicitlySensitive = true;
      }
      Object.values(value).forEach(collect);
    }
  }

  parts.forEach(collect);
  if (explicitlySensitive) return true;

  const text = textParts.join(" ");
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export function privacyClass(...parts) {
  return hasPrivacySensitiveContent(...parts) ? "privacy-sensitive" : "";
}

const SENSITIVE_PATTERNS = [
  /\b(brokerage|broker|robinhood|rocketmoney|bank|banking|financials?|finance|tax(?:es)?|1099|statement|staking|earnings?|balance|account\s+disconnected)\b/i,
  /\b(bought|buy|purchase|purchased|ordered|order\s+(?:confirmation|placed)|delivered|delivery|receipt|invoice|amazon|google\s+play|galaxy\s+(?:tab|s10\+?)|samsung\s+sm-x820|new\s+(?:device|tablet))\b/i,
  /\b(doctor'?s?|physician|medical|health|hospital|clinic|appointment|dentist|therapy|therapist|pharmacy|prescription|medication|patient|lab\s+result|insurance)\b/i,
  /\$\s?\d/
];
