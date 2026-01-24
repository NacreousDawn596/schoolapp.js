# Managers

Managers handle specific domains of the SchoolApp API, such as grades, attendance, profile, and courses. They all inherit from a common `BaseManager`.

## `BaseManager`

The foundation for all other managers.

### Properties
- **`client`**: Reference to the `SchoolAppClient`.
- **`httpClient`**: Reference to the `HTTPClient` from the main client.
- **`auth`**: Reference to the `AuthManager` from the main client.

### Methods
- **`ensureLoggedIn()`**: Checks if the user is authenticated. Returns `boolean`.
- **`async getJsonOrParse(url, parser, params = null, refreshCsrf = true)`**: A helper method that fetches a URL, updates the CSRF token, and uses a parser to return structured data.

---

## `GradesManager`

Handles student grades and academic results. Inherits from `BaseManager`.

### Methods
- **`async getElementNotes(current = false)`**: Fetches element-level grades.
    - `current`: If `true`, fetches only current/in-progress grades.
    - Returns: `Promise<Array<Element>>`.
- **`async getModuleNotes(current = false)`**: Fetches module-level grades.
    - `current`: If `true`, fetches only current/in-progress grades.
    - Returns: `Promise<Array<Module>>`.
- **`async getYears()`**: Fetches academic year results.
    - Returns: `Promise<Array<Annee>>`.
- **`async getSemesters()`**: Fetches semester results.
    - Returns: `Promise<Array<Semestre>>`.

---

## `AttendanceManager`

Handles absences and sanctions. Inherits from `BaseManager`.

### Methods
- **`async getAbsences()`**: Fetches a summary and details of student absences.
    - Returns: `Promise<Object>`.
- **`async getSanctions()`**: Fetches student sanctions.
    - Returns: `Promise<Object>`.

---

## `ProfileManager`

Handles student profile information and program listings. Inherits from `BaseManager`.

### Methods
- **`async getProfile()`**: Fetches the student's complete profile information.
    - Returns: `Promise<Object>`.
- **`async getFilieres()`**: Fetches the list of available majors/filieres.
    - Returns: `Promise<Array<Object>>`.

---

## `CourseManager`

Handles course-related data and study plans. Inherits from `BaseManager`.

### Methods
- **`async getModules(niveau, filiere, semestre, refreshCsrf = false)`**: Fetches modules for a specific configuration.
    - `niveau`: Academic level (e.g., '1A').
    - `filiere`: Major code.
    - `semestre`: Semester ID.
    - `refreshCsrf`: If `true`, refreshes the CSRF token before making the request.
    - Returns: `Promise<Object>`.
