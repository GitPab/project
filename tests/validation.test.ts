import { validateCost, validateEmail, validatePhoneNumber, validateWordCount, formatValidationErrors, combineValidationErrors, createFieldValidationResult, validateUniversityName, validateCountry } from "../src/app/utils/validation";

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (e: any) {
    console.error(`FAIL ${name}:`, e.message || e);
    process.exitCode = 1;
  }
}

// validateCost
run("validateCost allows empty", () => {
  expect(validateCost("").length === 0, "Empty should be valid (optional)");
});

run("validateCost detects non-number", () => {
  expect(validateCost("abc").includes("Phải là số hợp lệ"), "Should flag non-number");
});

run("validateCost detects negative and decimals", () => {
  const errs = validateCost(-1);
  expect(errs.includes("Không thể là số âm"), "Should flag negative");
  const dec = validateCost(1.5);
  expect(dec.includes("Phải là số nguyên (không có phần thập phân)"), "Should flag decimal");
});

// validateEmail
run("validateEmail basic valid", () => {
  expect(validateEmail("user@example.com").length === 0, "Valid email should pass");
});

run("validateEmail invalid", () => {
  expect(validateEmail("user@bad").includes("Địa chỉ email không hợp lệ"), "Should flag invalid email");
});

// validatePhoneNumber
run("validatePhoneNumber valid formats", () => {
  for (const p of ["0912345678", "+84912345678", "84123456789".replace("123", "912")]) {
    expect(validatePhoneNumber(p).length === 0, `Valid phone should pass: ${p}`);
  }
});

run("validatePhoneNumber invalid", () => {
  expect(validatePhoneNumber("0712345678").length > 0, "Invalid prefix should fail");
});

// validateWordCount
run("validateWordCount respects max", () => {
  const text = Array.from({ length: 5 }, (_, i) => `w${i}`).join(" ");
  expect(validateWordCount(text, 5).isValid, "Boundary should be valid");
  expect(!validateWordCount(text + " extra", 5).isValid, "Exceeding should be invalid");
});

// helpers
run("formatValidationErrors joins", () => {
  expect(formatValidationErrors(["a", "b"]) === "a • b", "Should join with bullets");
});

run("combineValidationErrors flattens and filters", () => {
  const res = combineValidationErrors([], ["a"], undefined, ["b"]);
  expect(res.length === 2 && res[0] === "a" && res[1] === "b", "Should flatten");
});

run("createFieldValidationResult maps", () => {
  const r = createFieldValidationResult(["err"]);
  expect(!r.isValid && r.message.includes("err"), "Should map correctly");
});

// domain validators
run("validateUniversityName bounds", () => {
  expect(validateUniversityName("").length > 0, "Empty invalid");
  expect(validateUniversityName("ab").length > 0, "Too short invalid");
  expect(validateUniversityName("a".repeat(101)).length > 0, "Too long invalid");
  expect(validateUniversityName("Valid Name").length === 0, "Valid ok");
});

run("validateCountry bounds", () => {
  expect(validateCountry("").length > 0, "Empty invalid");
  expect(validateCountry("a").length > 0, "Too short invalid");
  expect(validateCountry("a".repeat(51)).length > 0, "Too long invalid");
  expect(validateCountry("Vietnam").length === 0, "Valid ok");
});
