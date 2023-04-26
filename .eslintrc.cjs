/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve("@astrojs/site-kit/eslint")],
  rules: {
    // these rules are too aggressive for the time being
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
  },
}
