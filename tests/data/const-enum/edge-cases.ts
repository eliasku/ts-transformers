export const enum EdgeEnum {
  A = 1,
  B, // Expect: 2 (implicit)
  C = B + 1, // Expect: 3 (reference to B)
  D = "foo",
  E = D + "bar", // Expect: "foobar"
}

export const C = EdgeEnum.C;
export const B = EdgeEnum.B;
export const D = EdgeEnum.D;
export const E = EdgeEnum.E;
