/**
 * Parser for modules and elements HTML content
 */
const cheerio = require('cheerio-without-node-native');

/**
 * Parse HTML content containing modules and their elements
 * @param {string} htmlContent - HTML content to parse
 * @returns {Object} Structured module data
 */
function parse(htmlContent) {
    const $ = cheerio.load(htmlContent);
    const modules = {};

    const mainTable = $('table.table.table-striped.table-sm.mb-1.display');
    if (!mainTable.length) {
        return {}; // Return empty instead of raising error for robustness
    }

    const tbody = mainTable.find('tbody');
    if (!tbody.length) {
        return {};
    }

    const rows = tbody.children('tr');
    let currentMod = null;

    rows.each((i, row) => {
        const $row = $(row);
        const classes = $row.attr('class') || '';

        if (classes.includes('clickable')) {
            const cols = $row.find('td');
            if (cols.length >= 10) {
                currentMod = $(cols[1]).text().trim();
                modules[currentMod] = {
                    intitule: $(cols[2]).text().trim(),
                    niveau: $(cols[4]).text().trim(),
                    semestre: $(cols[5]).text().trim(),
                    vhmod: parseInt($(cols[6]).text().trim() || '0'),
                    coef: parseFloat($(cols[7]).text().trim() || '0'),
                    seuil: parseFloat($(cols[8]).text().trim() || '0'),
                    eliminatoire: parseFloat($(cols[9]).text().trim() || '0'),
                    elements: []
                };
            }
        } else if (classes.includes('collapse') && currentMod) {
            const innerTable = $row.find('table');
            if (innerTable.length && innerTable.find('tbody').length) {
                innerTable.find('tbody tr').each((j, erow) => {
                    const ecol = $(erow).find('td');
                    if (ecol.length >= 10) {
                        modules[currentMod].elements.push({
                            code: $(ecol[0]).text().trim(),
                            intitule: $(ecol[1]).text().trim(),
                            vh_ctd: parseInt($(ecol[2]).text().trim() || '0'),
                            vh_tp: parseInt($(ecol[3]).text().trim() || '0'),
                            vh_eval: parseInt($(ecol[4]).text().trim() || '0'),
                            coef_cc: parseFloat($(ecol[5]).text().trim() || '0'),
                            coef_ex: parseFloat($(ecol[6]).text().trim() || '0'),
                            coef_ecrit: parseFloat($(ecol[7]).text().trim() || '0'),
                            coef_tp: parseFloat($(ecol[8]).text().trim() || '0'),
                            coef_elem: parseFloat($(ecol[9]).text().trim() || '0')
                        });
                    }
                });
            }
        }
    });

    return modules;
}

module.exports = { parse };
