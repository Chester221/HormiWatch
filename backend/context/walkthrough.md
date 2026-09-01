# Timezone Correction Walkthrough

Implemented a robust solution to handle the timezone discrepancy between the application (UTC) and the shared hosting database (EST/UTC-5).

## Problem
The database server forces `Current Time` to EST (UTC-5), causing `CURRENT_TIMESTAMP` to insert local EST times. TypeORM and the driver were treating these strings as UTC, resulting in a 5-hour shift. Additionally, rewriting the Date object back to the DB caused a "Double Shift" issue.

## Solution

### 1. Transformer Logic
We implemented custom TypeORM transformers that strictly interpret string dates from the DB as **EST (UTC-5)** and strictly convert App dates (UTC) to **EST strings** for storage.

- **Read (DB -> App):** `14:00 (EST String)` -> `Temporal parses as EST` -> `19:00 (UTC Date)`
- **Write (App -> DB):** `19:00 (UTC Date)` -> `Temporal converts to EST` -> `14:00 (EST String)`

### 2. Double Shift Prevention
Added logic to detect if `TypeORM` is passing an already-transformed `Date` or `Temporal` object back into the transformer (common during `save()` operations). If detected, we return the object as-is to prevent applying the 5-hour shift a second time.

### 3. Files Modified
- [`src/app.module.ts`](file:///c:/proyectos/HormiWatch2/backend/src/app.module.ts): Configured `extra: { dateStrings: true }` to bypass driver date parsing.
- [`src/common/transformers/utc-date.transformer.ts`](file:///c:/proyectos/HormiWatch2/backend/src/common/transformers/utc-date.transformer.ts): Implemented strict EST logic for standard `Date` columns.
- [`src/common/transform/temporal.transformer.ts`](file:///c:/proyectos/HormiWatch2/backend/src/common/transform/temporal.transformer.ts): Implemented strict EST logic for `Temporal` columns.
- **Entities Applied:** `BaseUuidEntity` (User, Role, etc.), `Profile`, `Task`, `Project`.

## Verification Results
User confirmed with a test record:
- **Caracas Time:** ~15:51 (UTC-4)
- **UTC Time:** ~19:51
- **DB Stored:** `14:51` (EST, correct -5h offset).
- **API Response:** `19:51` (UTC, correct).

The system now correctly handles the fixed EST offset of the shared hosting environment.
