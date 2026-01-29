export const enum ImportedEnum {
  Foo = 1,
  Bar = 2,
}

export const enum ImportedEnum2 {
  Foo2 = 1,
  Bar2 = 2,
}

export const enum ImportedEnum3 {
  Foo = 1,
  Bar = 2,
}

export interface TempObject {
  ts: number;
  id: number;
}

export let state = 2;
export const setState = (s) => (state = s);
