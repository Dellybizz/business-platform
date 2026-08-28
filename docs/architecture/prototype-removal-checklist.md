# Prototype removal checklist

The checklist is intentionally incomplete until later phases deliver each replacement.

| Prototype area | Replacement phase | Replacement verified | Data migrated | Old code removed |
|---|---:|---:|---:|---:|
| Three-mode landing/onboarding | 1 | No | N/A | No |
| ChatGPT-coupled tenant helper | 2 | No | No | No |
| Hardcoded merchant admin shell | 3 | No | N/A | No |
| Direct-SQL workspace API | 1–3 | No | No | No |
| Flat pages and `sections_json` | 4–6 | No | No | No |
| Prototype page manager | 4–6 | No | N/A | No |
| Flat builder registry | 5 | No | N/A | No |
| Prototype visual editor | 6 | No | N/A | No |
| Static theme registry | 7 | No | N/A | No |
| Generic `content_items` commerce data | 8/12 | No | No | No |
| Prototype public API/renderer | 4/9/12 | No | No | No |
| Direct-SQL submissions APIs | 12/14 | No | No | No |
| Manual `database-setup.sql` bootstrap | 1+ | No | N/A | No |

An item can be marked removed only when its replacement passes the relevant smoke, migration and tenant-isolation tests.

