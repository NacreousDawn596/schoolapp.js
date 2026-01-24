/**
 * Parser for absences HTML content
 */
import * as cheerio from 'cheerio';

/**
 * Parse HTML content containing absence details
 * @param {string} htmlContent - HTML content to parse
 * @returns {Object} Absences data with summary and details
 */
export function parse(htmlContent) {
    const $ = cheerio.load(htmlContent);
    const result = { summary: [], details: [] };

    const tables = $('table').filter((i, el) => {
        const cls = $(el).attr('class') || '';
        return cls.includes('table');
    });

    if (tables.length < 2) {
        // Try fallback if strict class matching fails
        const allTables = $('table');
        if (allTables.length < 2) return result;
    }

    const targetTables = tables.length >= 2 ? tables : $('table');

    // Summary
    $(targetTables[0]).find('tr').each((i, row) => {
        if (i === 0) return; // Skip header
        const cells = $(row).find('td');
        if (cells.length >= 4) {
            result.summary.push({
                CodeElem: $(cells[0]).text().trim(),
                Intitule: $(cells[1]).text().trim(),
                Non_Justifiee: parseInt($(cells[2]).text().trim() || '0'),
                Justifiee: parseInt($(cells[3]).text().trim() || '0')
            });
        }
    });

    // Details
    $(targetTables[1]).find('tr').each((i, row) => {
        if (i === 0) return; // Skip header
        const cells = $(row).find('td');
        if (cells.length >= 5) {
            result.details.push({
                Element: $(cells[0]).text().trim(),
                Date: $(cells[1]).text().trim(),
                Seance: $(cells[2]).text().trim(),
                Justif: $(cells[3]).text().trim().toLowerCase() === "true",
                Remarques: $(cells[4]).text().trim()
            });
        }
    });

    // Semester info
    const alerts = $('.alert.alert-info');
    alerts.each((i, alert) => {
        const text = $(alert).text();
        if (text.toLowerCase().includes('semestre')) {
            const match = text.match(/S\d/);
            if (match) {
                result.semestre = match[0];
            }
        }
    });

    return result;
}
