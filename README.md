# SchoolApp.js

A JavaScript library designed to make interacting with the SchoolApp platform a lot less painful. Instead of wrestling with session cookies and manual HTML scraping, this library gives you a clean, object-oriented way to access your grades, attendance, and profile data.

## Why This Exists

Browsing the SchoolApp web interface manually for updates is slow. If you want to build a custom dashboard, a grade tracker, or a notification bot, you need a reliable way to get that data programmatically. This library takes care of:

- **Authentication**: Solid session management with automatic CSRF token handling.
- **Data Cleanup**: Converts messy HTML tables into structured JavaScript objects.
- **Smart Logic**: Handles nested modules, element-level statistics, and transcript parsing out of the box.

## Installation

```bash
npm install schoolapp
```

Or if you're working locally:

```bash
cd js
npm install
```

## Quick Start

### Basic Usage

Getting your data is as simple as this:

```javascript
import { SchoolAppClient } from 'schoolapp';

// Initialize and log in
const client = new SchoolAppClient();

if (await client.login("your.email@example.com", "password")) {
    // Get your basic info
    const profile = await client.getProfile();
    console.log(`Hello, ${profile.basic_info.full_name}!`);
    
    // Fetch your current semester grades
    const grades = await client.getCurrentElemNote();
    for (const item of grades) {
        console.log(`${item.CodeElem}: ${item.Moy}`);
    }
}
```

### Using Managers (Advanced)

The library is organized into several specific managers, so you always know where to find what you need:

```javascript
import { SchoolAppClient } from 'schoolapp';

const client = new SchoolAppClient();
await client.login("email@example.com", "password");

// Using the grades manager
const currentGrades = await client.grades.getElementNotes(true);
const allGrades = await client.grades.getElementNotes(false);
const years = await client.grades.getYears();
const semesters = await client.grades.getSemesters();

// Using the attendance manager
const absences = await client.attendance.getAbsences();
const sanctions = await client.attendance.getSanctions();

// Using the profile manager
const profile = await client.profile.getProfile();
const programs = await client.profile.getFilieres();

// Using the course manager
const modules = await client.courses.getModules("1A", "API-MPT", "S1");
```

## Project Layout

The library is organized into several specific managers:

- **`grades`**: Handle module marks, element notes, and academic year results.
- **`attendance`**: Track your absences and see any sanctions.
- **`profile`**: Access your personal data and administrative files.
- **`courses`**: Browse the study plan and available modules.

## API Reference

### SchoolAppClient

Main client class for interacting with the SchoolApp API.

#### Constructor

```javascript
new SchoolAppClient(baseUrl)
```

- `baseUrl` (optional): Base URL of the SchoolApp instance. Defaults to `https://schoolapp.ensam-umi.ac.ma`

#### Methods

##### Authentication

- `async login(email, password)`: Authenticate with email and password. Returns `true` if successful.

##### Profile

- `async getProfile()`: Get detailed student profile information.
- `async getFilieres()`: Get available academic programs.

##### Grades

- `async getCurrentElemNote()`: Get element grades for current semester.
- `async getElemNote()`: Get all element grades.
- `async getCurrentModNote()`: Get module grades for current semester.
- `async getModNote()`: Get all module grades.
- `async getAnnee()`: Get academic year results.
- `async getSemestre()`: Get semester results.

##### Attendance

- `async getAbsences()`: Get absence records.
- `async getSanctions()`: Get disciplinary sanctions.

##### Courses

- `async getModules(niveau, filiere, semestre, refreshCsrf)`: Get modules for a specific academic level, program, and semester.

### Domain Objects

#### Element

Represents an element (subject) with grades.

**Properties:**
- `CodeElem`: Element code
- `AU`: Academic year
- `CC`: Continuous evaluation grade
- `EX`: Exam grade
- `TP`: Practical work grade
- `Moy`: Overall average
- ... and more

**Methods:**
- `async ccStats()`: Get CC statistics (average, ranking, etc.)
- `async exStats()`: Get exam statistics
- `async tpStats()`: Get TP statistics
- `async moyStats()`: Get overall average statistics

#### Module

Represents a module (collection of elements).

**Properties:**
- `CodeMod`: Module code
- `AU`: Academic year
- `Moy`: Module average
- `Dec`: Decision

**Methods:**
- `async stats()`: Get module statistics

#### Annee

Represents an academic year result.

**Methods:**
- `async stats()`: Get year statistics

#### Semestre

Represents a semester result.

**Methods:**
- `async stats()`: Get semester statistics

## Examples

See the [examples](./examples) directory for complete working examples.

## Requirements

- Node.js >= 14.0.0
- Dependencies:
  - `axios` - HTTP client
  - `cheerio` - HTML parsing
  - `tough-cookie` - Cookie management

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributions

Found a bug or have an idea for a new feature? Feel free to open an issue or submit a pull request. Any help making this library better for everyone is appreciated!

## Acknowledgments

This is a JavaScript port of the Python [schoolapp-api](https://github.com/NacreousDawn596/schoolapp-api) library.
