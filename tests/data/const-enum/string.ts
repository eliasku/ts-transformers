export const enum StringEnum {
  A = "a",
  B = "b",
}

export const result = StringEnum.A; // Expect: "a"
export const result2 = StringEnum.B; // Expect: "b"
