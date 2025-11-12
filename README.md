# Bit-Byte Tree Viewer

Created for ACM at UCSD's bit-byte program. View trees and search for connections.

Contact @lemoncut on Discord to report any inaccuracies.

_(Yes, this whole thing is vibe-coded.)_

## Data source (no backend required)

This app is fully filesystem-backed and requires no Firebase or other backend services.

- All data comes from a single CSV file at `src/data/connections.csv`.
- Admin mode lets you add, edit, and delete rows; changes are written back to that CSV file on the server.
- If the CSV is missing, the app will start with no data and create the file when you add the first connection.

CSV columns:

- `bit` — child name
- `byte` — parent name
- `tree` — tree name
- `year` — year as a number
