// A robust CSV parser that handles quoted fields
export const parseCSV = <T>(text: string): T[] => {
  const lines = text.split(/\r\n|\n/);
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const result: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const row: any = {};
    let currentLine = lines[i];
    
    // Regex to match CSV fields, handling quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(currentLine)) !== null) {
      // Remove the delimiter
      let value = match[1];
      if (value) {
          if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1).replace(/""/g, '"');
          }
          matches.push(value.trim());
      } else {
        matches.push('');
      }
      if (matches.length === headers.length) break;
    }

    // Fallback split if regex fails or simple CSV
    const simpleSplit = currentLine.split(',');
    const fields = matches.length === headers.length ? matches : simpleSplit;

    headers.forEach((header, index) => {
      row[header] = fields[index] || '';
    });

    result.push(row as T);
  }

  return result;
};