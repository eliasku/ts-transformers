in bigger project: after transforming imports I have error: `Expected ',', got 'ident'`

this import:

`import { createProgram, type Program, ShaderUniformName, ShaderAttributeName } from "@lib/rendering/program";`

transformed to 

`import { createProgram, type Program } from "@lib/rendering/program";`

which is correct because ShaderUniformName and ShaderAttributeName are const enums.
Rollup and Rollup typescript plugin 2 outputs:
```
1: import { createProgram, type Program } from "@lib/rendering/program";
                                ^
2: export const newTwoColoredTextured = () => {
3:     const vs = 
```

Somehow plugin pass it next to rollup? But it should be transpiled by plugin as Program.
