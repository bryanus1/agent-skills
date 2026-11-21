# Code Smell Catalog

Each smell comes with how to recognize it, why it matters and the usual refactor (see [refactorings](refactorings.md)). The **Script** column says whether `detect-smells.mjs` flags it.

## Contents

1. [Functions](#functions)
2. [Names](#names)
3. [Conditionals and flow](#conditionals-and-flow)
4. [Data](#data)
5. [Errors](#errors)
6. [Coupling and change](#coupling-and-change)
7. [Frontend](#frontend)
8. [Tests](#tests)

## Functions

| Smell | Recognize it | Why it matters | Refactor | Script |
|---|---|---|---|---|
| Long function | Does not fit on one screen; has "sections" with comments | Forces you to hold too much context | Extract function | ✅ `long-function` |
| Too many parameters | > 3, or several of the same type in a row (`(string, string, string)`) | Unreadable calls that are easy to get wrong | Parameter object, preserve whole object | ✅ `too-many-params` |
| Flag argument | `fn(data, true)` changes what the function does | Two functions in disguise | Split into two functions or a named option | — |
| Mixed abstraction levels | `sendInvoice()` next to PDF byte manipulation | The intent is hard to see | Extract a function per level | — |
| Hidden side effect | A `get`/`is`/`calculate` that also writes | The name lies; causes bugs when calls are reordered | Separate query and command, rename | — |
| Dead code | Unused functions, branches or parameters; commented-out code | Noise and false leads | Delete | partial (`todo-comment`) |

## Names

| Smell | Recognize it | Refactor |
|---|---|---|
| Generic name | `data`, `info`, `item`, `tmp`, `handle`, `manager`, `utils` in a wide scope | Rename with the domain concept |
| Misleading name | `users` is a `Map`; `isValid` throws; `getX` does I/O | Rename, or change the behavior to match |
| Type encoding | `strName`, `IUserInterface`, `arrItems` (unless it is the project's convention) | Rename |
| Inconsistency | `fetchUser`, `getOrder`, `retrieveInvoice` for the same operation | Unify the vocabulary |
| Negative boolean | `isNotDisabled`, `!notFound` | Positive name (`isEnabled`) |

## Conditionals and flow

| Smell | Recognize it | Refactor | Script |
|---|---|---|---|
| Deep nesting | `if` inside `for` inside `if`… (arrow pointing right) | Guard clauses, extract function | ✅ `deep-nesting` |
| Complex condition | `if (a && (b \|\| !c) && d.length > 0)` | Extract a named variable or function | — |
| Nested ternary | `a ? b : c ? d : e` | `if`/`switch`, lookup table | ✅ `nested-ternary` |
| Repeated `switch` on type | The same `switch (kind)` in several places | Polymorphism or a strategy map (see the patterns skill) | — |
| Loop that does several things | A `for` that filters, transforms and accumulates at once | `filter`/`map`/`reduce` pipeline or split the loop | — |

## Data

| Smell | Recognize it | Refactor | Script |
|---|---|---|---|
| Magic number/string | `if (status === 3)`, `* 0.21`, repeated `'ADMIN'` | Named constant, enum, union of literals | ✅ `magic-number` |
| Primitive obsession | Emails, amounts and dates as loose `string`/`number` with repeated validation | Value object or branded type (`type Email = string & { __brand }`) | — |
| Data clump | The same 3 fields travel together through several functions | Extract a type or object | — |
| Argument mutation | The function modifies the object it receives | Return a new copy | — |
| Mutable global state | Module variables modified from several functions | Encapsulate, inject | — |

## Errors

| Smell | Recognize it | Refactor |
|---|---|---|
| Swallowed error | `catch {}`, `catch (e) { console.log(e) }` and carry on as if nothing happened | Handle, rethrow with context or let it propagate |
| Generic error | `throw new Error('error')`, `return -1` as failure | Specific domain errors or a `Result` type |
| Ambiguous null | `return null` means "not found", "error" or "unauthorized" depending on the case | Tell them apart with types or explicit errors |
| Scattered validation | The same check in every layer | Validate at the edge, strong types inside |

## Coupling and change

| Smell | Recognize it | Refactor |
|---|---|---|
| Duplicated code | The same logic in 3+ places (rule of three) | Extract function/module |
| Divergent change | One file changes for unrelated reasons (UI and pricing rules) | Split by responsibility (see SOLID/SRP) |
| Shotgun surgery | A small change forces you to touch many files | Bring the related logic together |
| Feature envy | A function uses more data from another object than from its own | Move the function to where the data is |
| Message chain | `order.customer.address.country.code` | Hide delegate, method with intent |
| Long file | Hundreds of lines with several concepts | Split by concept |

## Frontend

| Smell | Recognize it | Refactor |
|---|---|---|
| God component | Fetch, state, validation, formatting and layout in a 300-line component | Extract hooks, pure functions and subcomponents |
| Derived state in state | `useState` + `useEffect` for something computable from props/state | Compute during render (`useMemo` if expensive) |
| Prop drilling | Props that cross 3+ levels without being used | Composition (`children`), scoped context |
| Logic in JSX | Ternaries and `map` with business logic inside the markup | Extract to variables or functions before the `return` |
| Effects without cleanup | `useEffect` with subscriptions or timers and no cleanup | Return the cleanup function |

## Tests

| Smell | Recognize it | Refactor |
|---|---|---|
| Test that checks implementation | Verifies internal calls or private state | Test observable behavior |
| Test with logic | `if`/`for` inside the test | Separate cases or a case table (`it.each`) |
| Irrelevant data | 30 fixture fields to test one | Builder with default values |
| Time-fragile test | Depends on real `Date.now()` or `setTimeout` | Injected clock or fake timers |
