/**
 * Parser for sanctions HTML content
 */
const cheerio = require('cheerio-without-node-native');

/**
 * Parse HTML content containing disciplinary sanctions
 * @param {string} htmlContent - HTML content to parse
 * @returns {Object} Sanctions data
 */
function parse(htmlContent) {
    const $ = cheerio.load(htmlContent);
    const result = {
        Absences_non_justifiees: 0,
        Absences_justifiees: 0,
        Sanction: "",
        Message: "",
        Elements_non_autorises: []
    };

    let table = $('.table.table-striped.table-sm').first();
    if (!table.length) {
        table = $('table').first();
    }
    if (table.length) {
        table.find('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length === 2) {
                const key = $(cells[0]).text().trim();
                const valCell = $(cells[1]);
                const valText = valCell.text().trim();

                if (key.includes("non justifiées")) {
                    result.Absences_non_justifiees = parseInt(valText || '0');
                } else if (key.includes("justifiées")) {
                    result.Absences_justifiees = parseInt(valText || '0');
                } else if (key === "Sanction") {
                    const btn = valCell.find('button');
                    result.Sanction = btn.length ? btn.text().trim() : valText;
                } else if (key === "Message") {
                    result.Message = valText;
                } else if (key.includes("pas autorisé")) {
                    const elements = [];
                    valCell.find('button.elem').each((i, btn) => {
                        elements.push($(btn).text().trim());
                    });
                    result.Elements_non_autorises = elements;
                }
            }
        });
    }

    const alert = $('.alert.alert-info');
    if (alert.length) {
        const match = alert.text().match(/S\d/);
        if (match) {
            result.Semestre = match[0];
        }
    }

    return result;
}

module.exports = { parse };
