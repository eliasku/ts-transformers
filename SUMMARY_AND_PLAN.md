 - don't transform imports and exports
 - we don't remove const enum declaration, but change it to `export let` variable to preserve correct export / import flow and don't need to modify them, because it will brake all typescript processing

last changelog is: 
- remove option, keep enum declarations and import/export statements

TODO: 
- [x] revert back to @rollup/typescript-plugin
- [x] review code
- [x] cleanup main code
- [x] cleanup test cases
- [x] fix and improve readme
