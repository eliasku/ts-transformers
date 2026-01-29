import { regularValue, type SomeType, MixedEnum } from "./export-test";

const value = regularValue;
const typeValue: SomeType = {} as any;
const result = MixedEnum.A;

export { value, typeValue, result };
