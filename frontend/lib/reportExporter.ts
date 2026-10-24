import { downloadTextFile } from './downloadFile';

/**
 * Escapes a cell value for standard CSV formatting.
 */
function escapeCsvValue(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports data matrix to a UTF-8 BOM CSV file for Excel / Spreadsheet compatibility.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const cleanFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  const headerLine = headers.map(h => escapeCsvValue(h)).join(',');
  const rowLines = rows.map(row => row.map(cell => escapeCsvValue(cell)).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  downloadTextFile(cleanFilename, csvContent, 'text/csv;charset=utf-8');
}

/**
 * Exports any structured object or array as a formatted JSON document.
 */
export function exportToJson(filename: string, data: unknown): void {
  const cleanFilename = filename.toLowerCase().endsWith('.json') ? filename : `${filename}.json`;
  const jsonContent = JSON.stringify(data, null, 2);
  downloadTextFile(cleanFilename, jsonContent, 'application/json;charset=utf-8');
}

export type PrintSummaryItem = {
  label: string;
  value: string | number;
};

/**
 * Opens a print-formatted view for direct printing or saving as PDF.
 */
export function printReport(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  metaSummary?: PrintSummaryItem[]
): void {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Please allow popups to print / save reports as PDF.');
    return;
  }

  const generatedDate = new Date().toLocaleString();
  const summaryHtml = metaSummary && metaSummary.length > 0
    ? `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
        ${metaSummary.map(item => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">${item.label}</div>
            <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${item.value}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const tableHeaderHtml = `
    <thead>
      <tr style="background: #0f172a; color: #ffffff;">
        <th style="padding: 10px 12px; text-align: left; font-size: 12px; border: 1px solid #0f172a; width: 45px;">#</th>
        ${headers.map(h => `<th style="padding: 10px 12px; text-align: left; font-size: 12px; border: 1px solid #0f172a;">${h}</th>`).join('')}
      </tr>
    </thead>
  `;

  const tableBodyHtml = `
    <tbody>
      ${rows.map((row, idx) => `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 8px 12px; font-size: 12px; border: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">${idx + 1}</td>
          ${row.map(cell => `
            <td style="padding: 8px 12px; font-size: 12px; border: 1px solid #e2e8f0; color: #334155;">
              ${cell === null || cell === undefined ? '<span style="color: #94a3b8;">-</span>' : String(cell)}
            </td>
          `).join('')}
        </tr>
      `).join('')}
    </tbody>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} - SafeReach Report</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
          }
          .brand span {
            color: #2563eb;
          }
          .title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 4px 0 2px 0;
          }
          .subtitle {
            font-size: 13px;
            color: #64748b;
          }
          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: #1e40af; font-weight: 600;">
            Report ready. Use Print dialog to print or save as PDF.
          </span>
          <button onclick="window.print()" style="background: #2563eb; color: #ffffff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>

        <div class="header-bar">
          <div>
            <div class="brand">Safe<span>Reach</span> Super Admin Reports</div>
            <div class="title">${title}</div>
            <div class="subtitle">${subtitle}</div>
          </div>
          <div class="meta-info">
            <div><strong>Generated:</strong> ${generatedDate}</div>
            <div><strong>Total Records:</strong> ${rows.length}</div>
            <div><strong>Classification:</strong> Confidential Super Admin Audit</div>
          </div>
        </div>

        ${summaryHtml}

        <table>
          ${tableHeaderHtml}
          ${tableBodyHtml}
        </table>

        <div class="footer">
          <span>SafeReach Enterprise Cloud &bull; Super Admin Platform Analytics</span>
          <span>Page 1 of 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
