"use strict";
/**
 * CSV Export Service
 * Handles conversion of data to CSV format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVExportService = void 0;
class CSVExportService {
    /**
     * Convert array of objects to CSV string
     */
    static generateCSV(data, columns) {
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
    static escapeCSVValue(value) {
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
    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current === null || current === void 0 ? void 0 : current[key];
        }, obj);
    }
    /**
     * Format date to readable string
     */
    static formatDate(date) {
        if (!date)
            return '';
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
    static formatDateTime(date) {
        if (!date)
            return '';
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
    static formatCurrency(amount, currency = 'AED') {
        if (amount === null || amount === undefined)
            return '';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount))
            return '';
        return `${currency} ${numAmount.toFixed(2)}`;
    }
    /**
     * Format boolean
     */
    static formatBoolean(value) {
        if (value === null || value === undefined)
            return '';
        return value ? 'Yes' : 'No';
    }
}
exports.CSVExportService = CSVExportService;
//# sourceMappingURL=csvExport.service.js.map