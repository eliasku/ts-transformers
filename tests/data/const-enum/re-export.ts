// This file imports from imported-enum.ts
import { ImportedEnum, ImportedEnum3 as MyEnym, MyEnum2 } from "./exports";

export const result = MyEnum2.Foo2; // Expect: 1
export const result2 = MyEnym.Bar; // Expect: 2
