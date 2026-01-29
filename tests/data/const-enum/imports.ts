// This file imports from imported-enum.ts
import { ImportedEnum, state as ll, type TempObject, setState } from "./imported-enum";

const result: TempObject = {
  ts: ImportedEnum.Foo, // Expect: 1
  id: ImportedEnum.Bar, // Expect: 2
};
let state = 3;
setState(5);

export const sum = result.id + result.ts + ll + state;
