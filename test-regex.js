function preprocessMath(raw) {
  let result = raw.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");
  result = result.replace(/\\\(/g, "$").replace(/\\\)/g, "$");
  return result;
}

const dbString1 = "\\[ x = 2 \\]"; // In JS, this is `\[ x = 2 \]`
const dbString2 = "\\\\[ x = 2 \\\\]"; // In JS, this is `\\[ x = 2 \\]`
console.log("1:", preprocessMath(dbString1));
console.log("2:", preprocessMath(dbString2));
