// This file imports from imported-enum.ts
import { ImportedEnum } from "./imported-enum";

export const result = ImportedEnum.Foo; // Expect: 1
export const result2 = ImportedEnum.Bar; // Expect: 2
