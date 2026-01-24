/**
 * Parser for module grades HTML content
 */
import * as cheerio from 'cheerio';

/**
 * Parse HTML content containing module grades
 * @param {string} htmlContent - HTML content to parse
 * @returns {Array<Object>} Array of module grade objects
 */
export function parse(htmlContent) {
    const $ = cheerio.load(htmlContent);
    let table = $('.table.table-striped.table-sm').first();
    if (!table.length) {
        table = $('table').first();
    }

    if (!table.length) {
        return [];
    }

    let headers = [];
    table.find('th').each((i, th) => {
        headers.push($(th).text().trim());
    });

    if (headers.length < 4) {
        headers = ["CodeMod", "AU", "Moy", "Dec"];
    }

    const data = [];
    const tbody = table.find('tbody').length ? table.find('tbody') : table;

    tbody.find('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 4) {
            const rowData = {};
            cells.slice(0, 4).each((i, cell) => {
                const val = $(cell).text().trim();
                if (headers[i] === "Moy") {
                    try {
                        rowData[headers[i]] = (val && val !== "--") ? parseFloat(val) : null;
                    } catch (error) {
                        rowData[headers[i]] = val;
                    }
                } else {
                    rowData[headers[i]] = val;
                }
            });
            data.push(rowData);
        }
    });

    return data;
}
