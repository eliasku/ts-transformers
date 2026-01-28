function MyDecorator(target: any, propertyKey: string | symbol) {
  void target;
  console.log(`Property decorated: ${String(propertyKey)}`);
}

class MyClass {
  @MyDecorator
  reasonable_name = "2";
}

const n = new MyClass();
console.info(n.reasonable_name);
