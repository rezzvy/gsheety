# Gsheety

## Overview

A JavaScript library to fetch data from Google Sheet

- Easy to use: just paste the sheet link and you're ready to go.
- Query the sheet document with ease.
- Get exported sheet data in various formats.
- and more to explore!

## How it Works

This library uses the gviz/tq API to fetch and parse data from Google Sheets.

## Installation

1. Include the source file in your project, either manually or by using our CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/rezzvy/gsheety@latest/dist/gsheety.min.js"></script>
```

_or if you're in node environment_

```
npm install gsheety
```

2. Assuming you're in a browser environment, you can use the library by calling the method directly `Gsheety.{methodName}`

_or if you're in node environment, you need to require it first._

```javascript
const Gsheety = require("gsheety");
```

## Usage

1. Fetch the data using `get()` method

```javascript
const sheet = "https://docs.google.com/spreadsheets/d/1X50-csrdsKDLxXIotiW3jZtccu_hE2qOR7WKzDxhdK4/edit?usp=sharing";

// Example #1: Fetch all data
Gsheety.get(sheet).then((data) => {
  console.log(data);
});

/*
Expected Output
{
  cols: [
    { label: "Name", type: "string" },
    { label: "Age", type: "number" },
    { label: "Hobby", type: "string" },
  ],
  rows: [
    ["Adam", 23, "Playing video games"],
    ["Ben", 25, "Cycling"],
    ["Chloe", 22, "Reading books"],
    ["Diana", 24, "Cooking"],
  ],
};
*/

// Example #2: Target specific data with a query
Gsheety.get(sheet, {
  query: "SELECT * WHERE A = 'Adam'",
}).then((data) => {
  console.log(data);
});

/*
Expected Output
{
  cols: [
    { label: "Name", type: "string" },
    { label: "Age", type: "number" },
    { label: "Hobby", type: "string" },
  ],
  rows: [["Adam", 23, "Playing video games"]],
};
*/
```

## Documentation

### `get(sheetLink, options)` method

This method is used to get the data from the google sheet.

- **First parameter**
  Expected to be a valid link to google sheet.

- **Second parameter (_optional_)**

```javascript
{
    // Query for the document. Syntax details: https://developers.google.com/chart/interactive/docs/querylanguage
    query: "SELECT *",
    // Sheet name. If invalid, the active sheet will be used.
    sheet: "Sheet1",
    // If true, returns raw JSON. If false, returns normalized data.
    raw: false,
    // If true, all null values will be removed from each row.
    clearNull: false
}
```

### `getExportedData(sheetLink, type)` method

This method is used to get data from various formats, and it does not support querying. The data is given as it is.

- **First parameter**
  Expected to be a valid link to google sheet.

- **Second parameter**
  Expected `csv, tsv, pdf, or xlsx`. Please note that when you use `pdf` or `xlsx`, it will return a blob, otherwise, it will return text.

### `generateTableFromOutput(data, options)` method

Generates an HTML `<table>` element from the parsed Google Sheets data output.

- **Parameters:**

  - `data` (Object): The parsed data object returned by the `get()` method.

    - `data.cols` (Array): Array of column metadata objects.
    - `data.rows` (Array): Array of rows, each being an array of cell values.
    - `data.msg` (string): Status message, expected to be `"ok"` for valid data.

  - `options` (Object, optional): Optional settings.

    - `className` (Object, optional): CSS class names for table elements.

      - `table` (string): Class name for the `<table>` element.
      - `thead` (string): Class name for the `<thead>` element.
      - `tbody` (string): Class name for the `<tbody>` element.

    - `callback` (Object, optional): Callback functions for customizing elements.

      - `theadItem` (function): Function called with each `<th>` element.
      - `tbodyItem` (function): Function called with each `<td>` element.

- **Returns:**
  `HTMLTableElement` — The constructed HTML table element.

- **Throws:**
  Throws an error if the `data` parameter is invalid or does not contain valid data.

## Contributing

There's always room for improvement. Feel free to contribute!

## Licensing

The app is licensed under MIT License. Check the license file for more details.
