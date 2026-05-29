export const INVALID_NUMERIC_INPUT_MESSAGE = "Invalid input for letters";

const PATTERNS = {
  digits: /^\d*$/,
  decimal: /^\d*(?:\.\d*)?$/,
  phone: /^[\d+\-\s()]*$/,
  card: /^[\d\s-]*$/,
  expiry: /^[\d/]*$/
};

export function isValidNumericInput(value, mode = "digits") {
  const text = String(value || "");
  const pattern = PATTERNS[mode] || PATTERNS.digits;
  return pattern.test(text);
}

export function hasInvalidNumericLetters(value) {
  return /[A-Za-z]/.test(String(value || ""));
}

export function getNumericInputError(value, mode = "digits") {
  if (hasInvalidNumericLetters(value) || !isValidNumericInput(value, mode)) {
    return INVALID_NUMERIC_INPUT_MESSAGE;
  }

  return "";
}
