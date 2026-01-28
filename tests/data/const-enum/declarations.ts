export const enum LocalEnum {
  A = 1,
}

export const result = LocalEnum.A; // Expect: 1, declaration removed
