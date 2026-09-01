// @ts-check
const { expo } = require('eslint-config-expo');

module.exports = [
  ...expo,
  {
    ignores: [
      'dist/*',
      'android/*',
      'ios/*',
      '.expo/*',
      'src/db/migrations/*',
    ],
  },
];
