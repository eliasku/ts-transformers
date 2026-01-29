// This file imports from imported-enum.ts
import { type TempObject, ImportedEnum } from "./imported-enum";

const result: TempObject = {
  ts: ImportedEnum.Foo, // Expect: 1
  id: ImportedEnum.Bar, // Expect: 2
};

export const sum = result.id + result.ts;
