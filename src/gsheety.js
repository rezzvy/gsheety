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
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Gsheety;
} else {
  window.Gsheety = Gsheety;
}
