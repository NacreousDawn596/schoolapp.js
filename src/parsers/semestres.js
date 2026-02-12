/**
 * Parser for semester academic results HTML content
 */
const cheerio = require('cheerio-without-node-native');

/**
 * Parse HTML content containing semester averages
 * @param {string} htmlContent - HTML content to parse
 * @returns {Array<Object>} Array of semester result objects
 */
function parse(htmlContent) {
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

    if (headers.length < 10) {
        headers = ["Niveau", "Filiere", "Semestre", "AU", "Statut", "Moy SEM", "PJ", "Decision", "Classement", "Releve de Notes"];
    }

    const data = [];
    const tbody = table.find('tbody').length ? table.find('tbody') : table;

    tbody.find('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 10) {
            const rowData = {};
            cells.slice(0, 10).each((i, cell) => {
                if (i === 9) { // Download link
                    const link = $(cell).find('a');
                    rowData[headers[i]] = link.length ? link.attr('href') : $(cell).text().trim();
                } else {
                    const val = $(cell).text().trim();
                    if (["Moy SEM", "PJ"].includes(headers[i])) {
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

module.exports = { parse };
