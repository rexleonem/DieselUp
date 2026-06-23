const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  { ignores: ['.expo/**', 'admin/dist/**', 'dist/**', 'functions/lib/**', 'functions/node_modules/**', 'node_modules/**'] },
  ...expo,
  {
    rules: { 'react-hooks/set-state-in-effect': 'off' }
  }
]);
