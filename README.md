# ueo-quarterly-metrics

Static web app for generating UEO quarterly metrics from local CSV exports.

## Use the Web UI

Open the GitHub Pages site, choose the reporting year and quarter, then upload the CSV exports into the matching file cards. The table updates in the browser as files are loaded, and the **Copy table** button copies a spreadsheet-friendly version of the results.

Each upload card has a `?` control with the required and optional columns for that file. The app runs entirely in the browser; uploaded files are not sent to a server.

The **VI-SPDAT Report** card accepts `.csv` files or the `.xlsx` workbook exported from the assessment system (multiple files can be uploaded and will be clubbed together). When that file is loaded, the VI-SPDAT metric is counted from it instead of Clients & Programs. Reading `.xlsx` files loads the SheetJS library from `cdn.sheetjs.com`, so that one card needs internet access; all other cards work fully offline.

## Local Development

Run the tests with:

```bash
npm test
```

For local browser testing, serve the repository root over HTTP and open `index.html`.

## Deployment

GitHub Actions runs the Node test suite on pushes and pull requests. Pushes to `main` deploy `index.html` and `src/` to GitHub Pages.
