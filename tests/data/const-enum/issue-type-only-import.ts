import { TypeOnlyEnum } from "./export-test";
import type { SomeType } from "./export-test";

const typeValue: SomeType = {} as any;
const result3 = TypeOnlyEnum.E;

export { result3 };
