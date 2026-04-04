function sanitizeSpreadsheetCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeCsvValue(value: string) {
  const sanitized = sanitizeSpreadsheetCell(value).replace(/"/g, '""');
  return /[",\n]/.test(sanitized) ? `"${sanitized}"` : sanitized;
}

export function exportToCSV<T>(data: T[], filename: string, columns: { key: keyof T; label: string }[]) {
  const headers = columns.map(c => escapeCsvValue(c.label)).join(',');
  const rows = data.map(item => 
    columns.map(c => {
      const value = item[c.key];
      const stringValue = value === null || value === undefined ? '' : String(value);
      return escapeCsvValue(stringValue);
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function parseCSV<T>(csv: string, columns: { key: keyof T; label: string }[]): T[] {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: T[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const item: any = {};
    
    columns.forEach((col, index) => {
      if (headers[index]) {
        item[col.key] = values[index] || '';
      }
    });
    
    data.push(item as T);
  }
  
  return data;
}

export function exportToPDF(title: string, data: any[], columns: { key: string; label: string }[], filename: string) {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(title, 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
      
      const tableData = data.map(row => columns.map(col => {
        const value = row[col.key];
        return value === null || value === undefined ? '' : String(value);
      }));
      
      (doc as any).autoTable({
        head: [columns.map(c => c.label)],
        body: tableData,
        startY: 35,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    });
  });
}

export function exportToExcel<T>(data: T[], filename: string, columns: { key: keyof T; label: string }[]) {
  import('xlsx').then((XLSX) => {
    const headers = columns.map(c => c.label);
    const rows = data.map(item =>
      columns.map(c => {
        const value = item[c.key];
        return value === null || value === undefined ? '' : String(value);
      })
    );
    
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  });
}
