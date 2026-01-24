/**
 * Parser for academic programs (filieres) HTML content
 */
import * as cheerio from 'cheerio';

/**
 * Parse HTML content containing a table of academic programs and return structured data
 * @param {string} htmlContent - HTML content as a string
 * @returns {Array<Object>} List of program information objects
 */
export function parse(htmlContent) {
    const $ = cheerio.load(htmlContent);

    // Find the table - using multiple selectors to be safe
    let table = $('table.table.table-striped.table-sm.mb-1.display');

    if (!table.length) {
        // Try alternative selector
        table = $('table.table');
    }

    if (!table.length) {
        return [];
    }

    // Extract table headers
    let headers = [];
    const thead = table.find('thead');
    if (thead.length) {
        const headerRow = thead.find('tr');
        if (headerRow.length) {
            headerRow.find('th').each((i, th) => {
                headers.push($(th).text().trim());
            });
        }
    }

    // If headers weren't found in thead, use hardcoded ones
    if (headers.length === 0) {
        headers = ["Code", "Intitule", "Departement", "Accreditation", "Descriptif", "Plan_Etudes"];
    }

    // Clean up header names
    const cleanedHeaders = headers.map(header => {
        if (header === "Plan_Etudes") {
            return "Plan d'Etude";
        }
        return header;
    });

    // Extract table rows
    const data = [];
    let tbody = table.find('tbody');

    if (!tbody.length) {
        tbody = table; // If no tbody, search in table directly
    }

    tbody.find('tr').each((i, row) => {
        const cells = $(row).find('td');

        if (cells.length >= cleanedHeaders.length) {
            const rowData = {};
            cells.slice(0, cleanedHeaders.length).each((i, cell) => {
                const cellText = $(cell).text().trim();
                rowData[cleanedHeaders[i]] = cellText;
            });
            data.push(rowData);
        }
    });

    return data;
}
