/**
 * CSV Export Service
 * Handles conversion of data to CSV format
 */

export interface CSVColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export class CSVExportService {
  /**
   * Convert array of objects to CSV string
   */
  static generateCSV(data: any[], columns: CSVColumn[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // Generate header row
    const headers = columns.map((col) => this.escapeCSVValue(col.label));
    const headerRow = headers.join(',');

    // Generate data rows
    const dataRows = data.map((row) => {
      const values = columns.map((col) => {
        let value = this.getNestedValue(row, col.key);

        // Apply custom formatter if provided
        if (col.format && value !== null && value !== undefined) {
          value = col.format(value);
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }

        return this.escapeCSVValue(String(value));
      });

      return values.join(',');
    });

    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  private static escapeCSVValue(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Get nested object value using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Format date to readable string
   */
  static formatDate(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format datetime to readable string
   */
  static formatDateTime(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number | string | null, currency: string = 'AED'): string {
    if (amount === null || amount === undefined) return '';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '';
    return `${currency} ${numAmount.toFixed(2)}`;
  }

  /**
   * Format boolean
   */
  static formatBoolean(value: boolean | null): string {
    if (value === null || value === undefined) return '';
    return value ? 'Yes' : 'No';
  }
}
