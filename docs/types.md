# Data Types

The library uses domain models to represent various school-related data. All data models inherit from `BaseType`.

## `BaseType`

The base class for all domain models. It dynamically maps keys from parsed data to object properties (cleaning up keys like replacing spaces with underscores).

### Properties
- **`client`**: Reference to the `SchoolAppClient`.
- **`_stats`**: Internal cache for fetched statistics.

### Methods
- **`constructor(client, data)`**: Initializes the object and maps data keys to properties.
- **`_ensureLoggedIn()`**: Internal helper to check authentication.
- **`async _getStats(url, params)`**: Internal helper to fetch statistical data.

---

## `Element`

Represents a module element (subject) with its grades.

### Properties
- Dynamically mapped from parsed data (e.g., `CodeElem`, `AU`, `CC`, `EX`, `TP`, `Moy`).

### Methods
- **`async fetchStats(evalType)`**: Fetches statistics for a specific evaluation type (`NoteCC`, `NoteEX`, `NoteTP`, `MoyElem`).
- **`async ccStats()`**: Retrieves cached or fresh statistics for Continuous Control (CC).
- **`async exStats()`**: Retrieves cached or fresh statistics for Exams (EX).
- **`async tpStats()`**: Retrieves cached or fresh statistics for Practical Work (TP).
- **`async moyStats()`**: Retrieves cached or fresh statistics for the Element Average (Moy).

---

## `Module`

Represents a course module.

### Properties
- Dynamically mapped (e.g., `CodeMod`, `AU`, `Moy`).

### Methods
- **`async fetchStats()`**: Fetches statistical distribution for the module average.
- **`async stats()`**: Retrieves cached or fresh module statistics.

---

## `Annee`

Represents an academic year result.

### Properties
- Dynamically mapped (e.g., `Niveau`, `Filiere`, `AU`, `Moy_Annee`).

### Methods
- **`async fetchStats()`**: Fetches statistical distribution for the year average.
- **`async stats()`**: Retrieves cached or fresh year statistics.

---

## `Semestre`

Represents a semester result.

### Properties
- Dynamically mapped (e.g., `Niveau`, `Filiere`, `Semestre`, `AU`, `Moy_SEM`).

### Methods
- **`async fetchStats()`**: Fetches statistical distribution for the semester average.
- **`async stats()`**: Retrieves cached or fresh semester statistics.
