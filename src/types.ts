export interface OptimizerOptions {
  /**
   * An array of entry source files which will used to detect exported and internal fields.
   * Basically it should be entry point(s) of the library/project.
   * @example ['./src/index.ts']
   */
  entrySourceFiles: string[];

  /**
   * Prefix of generated names for private fields
   * @example '_private_' // default
   * @example '$p$'
   */
  privatePrefix: string;

  /**
   * Prefix of generated names for internal fields
   * @example '_internal_' // default
   * @example '$i$'
   */
  internalPrefix: string;

  /**
   * Comment which will treat a class/interface/type/property/etc and all its children as "public".
   * Set it to empty string to disable using JSDoc comment to detecting "visibility level".
   * @example 'public' // default
   * @example 'external'
   * @example ''
   */
  publicJSDocTag: string;

  /**
   * Whether fields that were decorated should be renamed.
   * A field is treated as "decorated" if itself or any its parent (on type level) has a decorator.
   */
  ignoreDecorated: boolean;

  /**
   * Whether to inline const enum values.
   */
  inlineConstEnums?: boolean;
}

export const enum VisibilityType {
  Internal = 0,
  Private = 1,
  External = 2,
}

export const defaultOptions: OptimizerOptions = {
  entrySourceFiles: [],
  privatePrefix: "$p$",
  internalPrefix: "$i$",
  publicJSDocTag: "public",
  ignoreDecorated: false,
  inlineConstEnums: true,
};
