class MyClass {
  /** @public */
  ZERO = 0;

  x = 2;
  t = 2;

  length() {
    return this.t * this.x + this.ZERO;
  }
}

const m = new MyClass();
console.info(m.length());
