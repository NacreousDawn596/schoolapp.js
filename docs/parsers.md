# Parsers

The library uses specialized parsers to extract structured data from the HTML responses. These are internal but documented for transparency.

## Common Interface

All parsers follow a simple functional interface:
- **`parse(htmlContent)`**: Takes a string of HTML and returns structured data (object or array).

---

## `noteElem`

Extracts element-level grades.
- **Returns**: Array of objects with keys like `CodeElem`, `AU`, `CC`, `EX`, `TP`, `Moy`, etc.

## `noteMod`

Extracts module-level grades.
- **Returns**: Array of objects with `CodeMod`, `AU`, `Moy`, `Dec`.

## `profile`

Extracts detailed student profile from the index page.
- **Structure**: `basic_info`, `academic_info`, `administrative_info`, `personal_info`, `family_info`, `contact_info`, `download_links`.

## `absences`

Parses absence records.
- **Structure**: `summary` (array), `details` (array), `semestre` (string).

## `sanctions`

Parses disciplinary records.
- **Structure**: `Absences_non_justifiees`, `Absences_justifiees`, `Sanction`, `Message`, `Elements_non_autorises`.

## `modules`

Parses complex study plan table with nested elements.
- **Returns**: Object keyed by module code.

## `stats`

Extracts distribution statistics from modal popups.
- **Returns**: Object with `Votre_note`, `Moyenne_promo`, `Max`, `Min`, `Ecart_type`, etc.

## `filieres`, `annees`, `semestres`

Parse their respective tables into arrays of objects.
