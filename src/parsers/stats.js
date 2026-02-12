/**
 * Parser for statistics HTML content
 */
const cheerio = require('cheerio-without-node-native');

/**
 * Extract statistics from modal/popup HTML content
 * @param {string} htmlContent - HTML content to parse
 * @returns {Object} Statistics object
 */
function parse(htmlContent) {
    const $ = cheerio.load(htmlContent);
    const expectedKeys = ["Votre note", "Moyenne promo", "Max", "Min", "Ecart type", "Effectif", "Votre classement"];

    // Find divs with 'stat' in their class name
    const statDivs = $('div').filter((i, div) => {
        const className = $(div).attr('class') || '';
        return className.toLowerCase().includes('stat');
    });

    for (let i = 0; i < statDivs.length; i++) {
        const div = statDivs[i];
        const tables = $(div).find('table');

        for (let j = 0; j < tables.length; j++) {
            const table = tables[j];
            const rows = $(table).find('tr');

            if (rows.length < 7) {
                continue;
            }

            const stats = {};
            rows.each((k, row) => {
                const th = $(row).find('th');
                const td = $(row).find('td');

                if (th.length && td.length) {
                    const key = th.text().trim();
                    const val = td.text().trim();

                    try {
                        if (["Effectif", "Votre classement"].includes(key)) {
                            stats[key.replace(/ /g, '_')] = parseInt(parseFloat(val));
                        } else if (["Votre note", "Moyenne promo", "Max", "Min", "Ecart type"].includes(key)) {
                            stats[key.replace(/ /g, '_')] = parseFloat(val);
                        } else {
                            stats[key.replace(/ /g, '_')] = val;
                        }
                    } catch (error) {
                        stats[key.replace(/ /g, '_')] = val;
                    }
                }
            });

            // Check if all expected keys are present
            const allKeysPresent = expectedKeys.every(key =>
                stats[key.replace(/ /g, '_')] !== undefined
            );

            if (allKeysPresent) {
                return stats;
            }
        }
    }

    return {};
}

module.exports = { parse };
