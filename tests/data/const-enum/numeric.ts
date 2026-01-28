export const enum NumericEnum {
  Zero = 0,
  Positive = 42,
  Negative = -5,
}

export const result = NumericEnum.Zero; // Expect: 0
export const result2 = NumericEnum.Positive; // Expect: 42
export const result3 = NumericEnum.Negative; // Expect: -5

console.info("asd");
