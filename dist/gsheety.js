class Gsheety {
  static parseURL(url) {
    const match = url.match(/\/d\/([^/]+)/);
    if (!match) throw new Error("Invalid Google Sheets URL");

    return `https://docs.google.com/spreadsheets/d/${match[1]}`;
  }

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
