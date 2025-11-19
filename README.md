# Bit-Byte Tree Viewer

Created for ACM at UCSD's bit-byte program. View trees and search for connections.

Contact @lemoncut on Discord to report any inaccuracies.

*(Yes, this whole thing is vibe-coded.)*

## Tech Stack

- **Framework:** Next.js 14 (App Router) with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **Data Visualization:** react-google-charts for org chart rendering
- **Data Parsing:** PapaParse for CSV reading/writing
- **Form Handling:** react-hook-form with Zod validation
- **Theming:** next-themes for dark/light mode

## Data source (no backend required)

This app is fully filesystem-backed and requires no Firebase or other backend services.

- All data comes from a single CSV file at `src/data/connections.csv`.
- Admin mode allows you to add, edit, and delete rows in the UI. **Note:** These changes are only persisted when running locally with a writable filesystem. On Vercel's serverless/static deployment, the filesystem is read-only, so changes will be lost on page reload. To update data in production, manually edit the CSV file and redeploy.
- If the CSV is missing, the app will start with no data.

CSV columns:

- `bit` — child name
- `byte` — parent name
- `tree` — tree name
- `year` — year as a number
