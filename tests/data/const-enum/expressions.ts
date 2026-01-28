export const enum ExprEnum {
  A = 1,
  B = A | 2, // Expect: 3
  C = A & 1, // Expect: 1
  D = A + 5, // Expect: 6
  E = (A + 2) * 3, // Expect: 9
  F = -A, // Expect: -1
  G = ~A, // Expect: -2
  H = D >> 1, // Expect: 3
  I = D << 2, // Expect: 24
}

export const A = ExprEnum.A;
export const B = ExprEnum.B;
export const C = ExprEnum.C;
export const D = ExprEnum.D;
export const E = ExprEnum.E;
export const F = ExprEnum.F;
export const G = ExprEnum.G;
export const H = ExprEnum.H;
export const I = ExprEnum.I;
