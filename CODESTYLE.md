# TypeScript Coding Style Guide

## Class Member Access Modifiers

- **Do NOT use the `public` modifier** on class members
- All class members are `public` by default in TypeScript
- Only use `private`, `protected`, or `readonly` modifiers when explicitly needed

```typescript
// Good
class User {
  name: string; // public by default
  private id: string;
  protected email: string;

  constructor(name: string) {
    this.name = name;
  }
}

// Avoid
class User {
  public name: string; // redundant public modifier
  public id: string;

  public constructor(name: string) {
    this.name = name;
  }
}
```

## Function vs Arrow Function Rules

### Arrow Functions `() => {...}`
- **Use arrow functions in all cases** where you don't need a new `this` context
- Arrow functions capture `this` from their surrounding scope (lexical `this`)

### Regular Functions `function name() {...}`
- **Use regular function ONLY** when you need a new `this` context inside
- Common use cases:
  - Object methods where `this` should refer to the object instance
  - Constructor functions
  - When you specifically need `this` binding behavior

## Arrow Function Short Form

### Direct Return

- Use short form when arrow function immediately returns a value:
```typescript
// Good
const getValue = () => 42;
const getName = (id: number) => users[id].name;

// Avoid
const getValue = () => {
  return 42;
};
```

### Returning Object Literals

- Wrap object literals in parentheses when using short form:
```typescript
// Good
const getUser = () => ({ id: 1, name: "John" });
const createConfig = () => ({ enabled: true, retries: 3 });

// Avoid
const getUser = () => { id: 1, name: "John" }; // Syntax error
const getUser = () => {
  return { id: 1, name: "John" }; // Verbose if not needed
};
```

## Examples

```typescript
// Arrow function - captures this from parent scope
const button = {
  label: "Click me",
  click1: () => {
    console.log("Button:", this.label); // this is from outer scope
  },
  click2() {
    console.log("Button:", this.label); // this refers to this button object
  }
};

button.click1(); // Works incorrectly: "Button: undefined"
button.click2(); // Works correctly: "Button: Click me"

// Constructor function - creates new this context
function Person(name: string) {
  this.name = name;
}

const person = new Person("John");
console.log(person.name); // "John"

// Short form arrow functions
const add = (a: number, b: number) => a + b;
const createPoint = (x: number, y: number) => ({ x, y });

// Multi-line arrow function (useful when logic is complex)
const processData = (input: string) => {
  const trimmed = input.trim();
  const uppercased = trimmed.toUpperCase();
  return uppercased.split(" ");
};
```
