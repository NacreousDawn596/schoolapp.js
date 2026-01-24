# SchoolApp.js Documentation

This directory contains the complete documentation for the SchoolApp.js library. If you're looking for how a specific part of the system works or what methods are available, you're in the right place.

## Where to Start?

If you're new here, the **[Main Client](client.md)** guide is the best place to start. It explains how to initialize the library and perform the most common actions.

## Documentation Sections

- **[Client API](client.md)**: The heart of the library. Start here to see how to log in and fetch data.
- **[Managers](managers.md)**: Deep dive into the specialized logic for Grades, Attendance, Profile, and Courses.
- **[Data Models](types.md)**: Details on the objects returned by the API (Elements, Modules, etc.).
- **[Internal Parsers](parsers.md)**: A look behind the curtain at how we pull data from the web pages.
- **[Core Utils](internal.md)**: Documentation for the underlying HTTP and Auth management.

## Quick Reference

### Installation

```bash
npm install schoolapp.js
```

### Basic Example

```javascript
import { SchoolAppClient } from 'schoolapp.js';

const client = new SchoolAppClient();
await client.login('email@example.com', 'password');

const grades = await client.getCurrentElemNote();
console.log(grades);
```

## Need Help?

If you're looking for general usage examples, check the main `README.md` in the root directory or take a look at `examples/basic_usage.js`.

## JavaScript-Specific Notes

### Async/Await

All API methods are asynchronous and return Promises. Always use `await` or `.then()` when calling them:

```javascript
// Good
const profile = await client.getProfile();

// Also good
client.getProfile().then(profile => {
    console.log(profile);
});
```

### ES6 Modules

The library uses ES6 module syntax (`import`/`export`). Make sure your `package.json` includes `"type": "module"` or use `.mjs` file extensions.

### Method Names

Method names follow JavaScript camelCase convention:
- Python: `get_current_elem_note()` → JavaScript: `getCurrentElemNote()`
- Python: `get_absences()` → JavaScript: `getAbsences()`
