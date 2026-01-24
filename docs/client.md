# SchoolAppClient

The `SchoolAppClient` is the main entry point for interacting with the SchoolApp API. It orchestrates authentication and provides access to various managers.

## Class: `SchoolAppClient`

Defined in: [school_app_client.js](../src/school_app_client.js)

### Constructor

#### `new SchoolAppClient(baseUrl)`

Initializes the client.

**Parameters:**
- `baseUrl` (string, optional): The base URL of the School App. Defaults to `https://schoolapp.ensam-umi.ac.ma`

**Example:**
```javascript
import { SchoolAppClient } from 'schoolapp.js';

// Use default URL
const client = new SchoolAppClient();

// Or specify custom URL
const customClient = new SchoolAppClient('https://custom-schoolapp.example.com');
```

### Properties

- **`baseUrl`** (string): The base URL being used
- **`httpClient`** ([HTTPClient](internal.md#httpclient)): Instance for making HTTP requests
- **`auth`** ([AuthManager](internal.md#authmanager)): Instance for handling login and CSRF tokens
- **`grades`** ([GradesManager](managers.md#gradesmanager)): Manager for grade-related operations
- **`attendance`** ([AttendanceManager](managers.md#attendancemanager)): Manager for attendance operations
- **`profile`** ([ProfileManager](managers.md#profilemanager)): Manager for profile operations
- **`courses`** ([CourseManager](managers.md#coursemanager)): Manager for course operations

### Methods

#### `async login(email, password)`

Authenticates the user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** `Promise<boolean>` - `true` if successful, `false` otherwise

**Example:**
```javascript
const success = await client.login('student@example.com', 'mypassword');
if (success) {
    console.log('Logged in successfully!');
} else {
    console.log('Login failed');
}
```

---

#### `async getProfile()`

Retrieves the user's profile information.

**Returns:** `Promise<Object|null>` - Profile object containing:
- `basic_info`: Name, photo, role
- `personal_info`: CIN, date of birth, etc.
- `contact_info`: Email, phone numbers
- `academic_info`: BAC details, entrance year
- `administrative_info`: Student code, status
- `family_info`: Parents' professions
- `download_links`: Document URLs

**Example:**
```javascript
const profile = await client.getProfile();
console.log(`Name: ${profile.basic_info.full_name}`);
console.log(`Email: ${profile.contact_info.Email}`);
```

---

#### `async getFilieres()`

Retrieves the list of available academic programs (filieres).

**Returns:** `Promise<Array<Object>|null>` - Array of filiere objects

**Example:**
```javascript
const programs = await client.getFilieres();
programs.forEach(program => {
    console.log(`${program.Code}: ${program.Intitule}`);
});
```

---

#### `async getAbsences()`

Retrieves the user's absence records.

**Returns:** `Promise<Object|null>` - Object containing:
- `summary`: Array of absence summaries per element
- `details`: Array of detailed absence records
- `semestre`: Current semester

**Example:**
```javascript
const absences = await client.getAbsences();
console.log('Total absences:', absences.summary.length);
absences.details.forEach(absence => {
    console.log(`${absence.Date} - ${absence.Element}: ${absence.Justif ? 'Justified' : 'Not justified'}`);
});
```

---

#### `async getSanctions()`

Retrieves the user's disciplinary sanctions.

**Returns:** `Promise<Object|null>` - Object containing sanctions data

**Example:**
```javascript
const sanctions = await client.getSanctions();
console.log(`Unjustified absences: ${sanctions.Absences_non_justifiees}`);
console.log(`Sanction: ${sanctions.Sanction}`);
```

---

#### `async getElemNote()`

Retrieves all element grades (across all semesters).

**Returns:** `Promise<Array<Element>>` - Array of [Element](types.md#element) objects

**Example:**
```javascript
const allGrades = await client.getElemNote();
allGrades.forEach(grade => {
    console.log(`${grade.CodeElem}: ${grade.Moy}`);
});
```

---

#### `async getCurrentElemNote()`

Retrieves only current semester element grades.

**Returns:** `Promise<Array<Element>>` - Array of [Element](types.md#element) objects

**Example:**
```javascript
const currentGrades = await client.getCurrentElemNote();
console.log(`You have ${currentGrades.length} elements this semester`);

// Get statistics for first element
if (currentGrades.length > 0) {
    const stats = await currentGrades[0].moyStats();
    console.log('Class average:', stats.Moyenne_promo);
    console.log('Your ranking:', stats.Votre_classement);
}
```

---

#### `async getModNote()`

Retrieves all module grades (across all semesters).

**Returns:** `Promise<Array<Module>>` - Array of [Module](types.md#module) objects

**Example:**
```javascript
const allModules = await client.getModNote();
allModules.forEach(module => {
    console.log(`${module.CodeMod}: ${module.Moy}`);
});
```

---

#### `async getCurrentModNote()`

Retrieves only current semester module grades.

**Returns:** `Promise<Array<Module>>` - Array of [Module](types.md#module) objects

**Example:**
```javascript
const currentModules = await client.getCurrentModNote();
console.log(`You have ${currentModules.length} modules this semester`);
```

---

#### `async getAnnee()`

Retrieves academic year results.

**Returns:** `Promise<Array<Annee>>` - Array of [Annee](types.md#annee) objects

**Example:**
```javascript
const years = await client.getAnnee();
years.forEach(year => {
    console.log(`${year.Niveau} (${year.AU}): ${year.Moy_Annee}`);
});
```

---

#### `async getSemestre()`

Retrieves semester results.

**Returns:** `Promise<Array<Semestre>>` - Array of [Semestre](types.md#semestre) objects

**Example:**
```javascript
const semesters = await client.getSemestre();
semesters.forEach(sem => {
    console.log(`${sem.Semestre} (${sem.AU}): ${sem.Moy_SEM}`);
});
```

---

#### `async getModules(niveau, filiere, semestre, refreshCsrf = false)`

Retrieves modules for a specific academic configuration.

**Parameters:**
- `niveau` (string): Academic level (e.g., "1A", "2A")
- `filiere` (string): Program code (e.g., "API-MPT")
- `semestre` (string): Semester (e.g., "S1", "S2")
- `refreshCsrf` (boolean, optional): Whether to refresh CSRF token before request. Default: `false`

**Returns:** `Promise<Object|null>` - Object keyed by module codes, each containing:
- `intitule`: Module title
- `niveau`, `semestre`: Academic info
- `vhmod`, `coef`, `seuil`, `eliminatoire`: Module parameters
- `elements`: Array of element objects within the module

**Example:**
```javascript
const modules = await client.getModules('1A', 'API-MPT', 'S1');

for (const [code, module] of Object.entries(modules)) {
    console.log(`\nModule: ${code} - ${module.intitule}`);
    console.log(`  Coefficient: ${module.coef}`);
    console.log(`  Elements: ${module.elements.length}`);
    
    module.elements.forEach(elem => {
        console.log(`    - ${elem.code}: ${elem.intitule}`);
    });
}
```

---

## Manager Access

You can also access functionality through specialized managers for better organization:

```javascript
// These are equivalent:
await client.getCurrentElemNote();
await client.grades.getElementNotes(true);

// Using managers directly
await client.grades.getElementNotes();
await client.attendance.getAbsences();
await client.profile.getProfile();
await client.courses.getModules('1A', 'API-MPT', 'S1');
```

See [Managers Documentation](managers.md) for details.
