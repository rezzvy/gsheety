class Gsheety {
  /**
   * Extracts the spreadsheet ID from a Google Sheets URL.
   * @param {string} url - The Google Sheets URL.
   * @returns {string} The formatted Google Sheets URL.
   * @throws {Error} If the URL is invalid.
   */
  static parseURL(url) {
    const match = url.match(/\/d\/([^/]+)/);
    if (!match) throw new Error("Invalid Google Sheets URL");

    return `https://docs.google.com/spreadsheets/d/${match[1]}`;
  }

  /**
   * Fetches and parses data from Google Sheets using the gviz/tq API.
   * @param {string} url - The Google Sheets URL.
   * @param {Object} options - Fetch options.
   * @param {string} [options.sheet="Sheet1"] - Sheet name.
   * @param {string} [options.query="SELECT *"] - SQL-like query.
   * @returns {Promise<Object>} Parsed JSON response.
   */
  static async fetchJSON(url, options) {
    const { sheet = "Sheet1", query = "SELECT *" } = options;

    const res = await fetch(`${this.parseURL(url)}/gviz/tq?sheet=${encodeURIComponent(sheet)}&tq=${encodeURIComponent(query)}`);

    if (res.ok) {
      const text = await res.text();
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

      if (!json.table) return { data: null, msg: "Invalid query or empty response" };
      return { data: json, msg: "ok" };
    }

    return { data: null, msg: `HTTP Error ${res.status}: ${res.statusText}` };
  }

  /**
   * Fetches structured data from Google Sheets.
   * @param {string} url - The Google Sheets URL.
   * @param {Object} [options={}] - Fetch options.
   * @param {boolean} [options.raw=false] - Return raw JSON if true.
   * @returns {Promise<Object>} Table columns and rows.
   * @throws {Error} If options is not an object.
   */
  static async get(url, options = {}) {
    if (typeof options !== "object") throw new Error("Options parameter must be an object");

    const res = await this.fetchJSON(url, options);
    if (!res.data) return { cols: [], rows: [], msg: res.msg };
    if (options.raw) return res;

    let cols = res.data.table.cols.map((col, index) => ({
      label: col?.label || `Column ${index + 1}`,
      columnId: col?.id,
      type: col?.type,
    }));

    let rows = res.data.table.rows.map((row) =>
      cols.map((_, i) => {
        const cell = row.c[i];
        return cell ? cell.v : null;
      })
    );

    if (options.clearNull) {
      rows = rows.map((row) => row.filter((cell) => cell !== null));
    }

    return { cols, rows, msg: res.msg };
  }

  /**
   * Exports Google Sheets data in a specific format.
   * @param {string} url - The Google Sheets URL.
   * @param {"csv"|"tsv"|"pdf"|"xlsx"} [type="csv"] - Export format.
   * @returns {Promise<string|Blob>} The exported data.
   * @throws {Error} If the format is unsupported or request fails.
   */
  static async getExportedData(url, type = "csv") {
    const formats = {
      csv: "export?format=csv",
      tsv: "export?format=tsv",
      pdf: "export?format=pdf",
      xlsx: "export?format=xlsx",
    };

    if (!formats[type]) throw new Error("Unsupported format. Use: csv, tsv, pdf, or xlsx.");

    const res = await fetch(`${this.parseURL(url)}/${formats[type]}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);

    return type === "pdf" || type === "xlsx" ? await res.blob() : await res.text();
  }

  /**
   * Generates an HTML table element from the given Google Sheets data output.
   * @param {Object} data - The parsed data object returned by the get() method.
   * @param {Array} data.cols - Array of column metadata objects.
   * @param {Array} data.rows - Array of rows, each being an array of cell values.
   * @param {string} data.msg - Status message, should be "ok" for valid data.
   * @param {Object} [options={}] - Optional settings.
   * @param {Object} [options.className] - CSS class names for table elements.
   * @param {string} [options.className.table] - Class name for the table element.
   * @param {string} [options.className.thead] - Class name for the thead element.
   * @param {string} [options.className.tbody] - Class name for the tbody element.
   * @param {Object} [options.callback] - Callback functions for customizing elements.
   * @param {function(HTMLElement):void} [options.callback.theadItem] - Called for each thead <th> element.
   * @param {function(HTMLElement):void} [options.callback.tbodyItem] - Called for each tbody <td> element.
   * @returns {HTMLTableElement} The constructed HTML table element.
   * @throws {Error} Throws if the data parameter is invalid or not available.
   */
  static generateTableFromOutput(data, options = {}) {
    if (!data || !Array.isArray(data.rows) || !Array.isArray(data.cols) || data.msg !== "ok") {
      throw new Error("Given data parameter is not valid or available.");
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    if (options.className?.table) table.className = options.className.table;
    if (options.className?.thead) thead.className = options.className.thead;
    if (options.className?.tbody) tbody.className = options.className.tbody;

    const headerRow = document.createElement("tr");
    data.cols.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col.label;
      headerRow.appendChild(th);

      if (typeof options.callback?.theadItem === "function") {
        options.callback.theadItem(th);
      }
    });
    thead.appendChild(headerRow);

    data.rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);

        if (typeof options.callback?.tbodyItem === "function") {
          options.callback.tbodyItem(td);
        }
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    return table;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Gsheety;
} else {
  window.Gsheety = Gsheety;
}
