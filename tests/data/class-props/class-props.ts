class MyClass {
  /** @public */
  veryPublicAPI() {
    return "success";
  }
  public apiMethod() {
    return "private";
  }
  internalHelper() {}
  private secret = 1;
}

const n = new MyClass();
export const a = n.veryPublicAPI();
