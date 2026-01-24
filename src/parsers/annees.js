/**
 * Parser for annual academic results HTML content
 */
import * as cheerio from 'cheerio';

/**
 * Parse HTML content containing annual averages
 * @param {string} htmlContent - HTML content to parse
 * @returns {Array<Object>} Array of annual result objects
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

    if (headers.length < 9) {
        headers = ["Niveau", "Filiere", "AU", "Statut", "Moy Année", "PJ", "Decision", "Classement", "Releve de Notes"];
    }

    const data = [];
    const tbody = table.find('tbody').length ? table.find('tbody') : table;

    tbody.find('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 9) {
            const rowData = {};
            cells.slice(0, 9).each((i, cell) => {
                if (i === 8) { // Download link
                    const link = $(cell).find('a');
                    rowData[headers[i]] = link.length ? link.attr('href') : $(cell).text().trim();
                } else {
                    const val = $(cell).text().trim();
                    if (["Moy Année", "PJ"].includes(headers[i])) {
                        try {
                            rowData[headers[i]] = (val && val !== "--") ? parseFloat(val) : null;
                        } catch (error) {
                            rowData[headers[i]] = val;
                        }
                    } else {
                        rowData[headers[i]] = val;
                    }
                }
            });
            data.push(rowData);
        }
    });

    return data;
}
