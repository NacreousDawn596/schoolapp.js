/**
 * Parser for user profile HTML content
 */
const cheerio = require('cheerio-without-node-native');

/**
 * Parse HTML content containing user profile and return detailed user data
 * @param {string} htmlContent - HTML content to parse
 * @returns {Object} Profile data object
 */
function parse(htmlContent) {
    const $ = cheerio.load(htmlContent);

    const result = {
        basic_info: {},
        academic_info: {},
        administrative_info: {},
        personal_info: {},
        family_info: {},
        contact_info: {},
        download_links: {},
        sections: {}
    };

    // Extract from sidebar - use more generic selectors as fallbacks
    const userPanel = $('.user-panel, .sidebar .info, .main-sidebar .user-panel');
    let foundSidebar = false;

    if (userPanel.length) {
        const img = userPanel.find('img.img-circle, img.user-image');
        if (img.length && img.attr('src')) {
            result.basic_info.photo_url = img.attr('src');
        }

        const infoDiv = userPanel.hasClass('info') ? userPanel : userPanel.find('.info');
        if (infoDiv.length) {
            const spans = infoDiv.find('span, p, a').filter((i, el) => $(el).text().trim().length > 0);
            if (spans.length >= 1) {
                result.basic_info.full_name = $(spans[0]).text().trim();
                foundSidebar = true;
            }
            if (spans.length >= 2) {
                result.basic_info.role = $(spans[1]).text().trim();
            }
        }
    }

    // Fallback if sidebar extraction failed
    if (!foundSidebar) {
        // Try looking for welcome message or header
        const welcome = $('.alert-info, .content-header h1, h1.m-0').first();
        if (welcome.length) {
            const text = welcome.text().trim();
            if (text.toLowerCase().includes('bienvenue')) {
                result.basic_info.full_name = text.replace(/bienvenue/gi, '').replace(/,/g, '').trim();
            }
        }
    }

    // Extract welcome message if not already set by fallback
    if (!result.basic_info.welcome_message) {
        const alertDiv = $('.alert.alert-info');
        if (alertDiv.length) {
            result.basic_info.welcome_message = alertDiv.text().trim();
        }
    }

    // Find all tables - use less restrictive class matching
    const tables = $('table').filter((i, el) => {
        const cls = $(el).attr('class') || '';
        return cls.includes('table');
    });

    if (tables.length >= 1) {
        // Administrative data table - usually first if multiple
        $(tables[0]).find('tr').each((i, row) => {
            const cells = $(row).find('th, td');
            if (cells.length >= 2) {
                const key = $(cells[0]).text().trim().replace(':', '').trim();
                const val = $(cells[1]).text().trim();
                result.administrative_info[key] = val;
            }
        });
    }

    if (tables.length >= 2) {
        // Personal data table - usually second
        $(tables[1]).find('tr').each((i, row) => {
            const cells = $(row).find('th, td');
            if (cells.length >= 2) {
                const key = $(cells[0]).text().trim().replace(':', '').trim();
                const val = $(cells[1]).text().trim();

                if (["Code", "CNE/Masar", "Nom", "Prénom", "Nom Arabe", "Prénom Arabe", "CIN", "Sexe", "Date Naissance", "Nationalité", "Lieu_Naissance"].includes(key)) {
                    result.personal_info[key] = val;
                } else if (["Email", "Téléphone", "Adr_Parents", "Ville", "Tel_Parents"].includes(key)) {
                    result.contact_info[key] = val;
                } else if (["Série BAC", "Année BAC", "Niveau Accès", "Annee Accès", "Voie Accès", "Académie"].includes(key)) {
                    result.academic_info[key] = val;
                } else if (["Prof_Père", "Prof_Mère"].includes(key)) {
                    result.family_info[key] = val;
                } else {
                    result.personal_info[key] = val;
                }
            }
        });
    }

    // Extract download links
    const attestation = $('a[href*="attestation-scolarite"]');
    if (attestation.length) {
        result.download_links.attestation_scolarite = attestation.attr('href') || '';
    }

    const mainImg = $('img[width="100"]');
    if (mainImg.length && mainImg.attr('src')) {
        result.basic_info.large_photo_url = mainImg.attr('src');
    }

    // Extract section titles
    $('h5').each((i, h5) => {
        const text = $(h5).text().trim();
        if (text.includes("Situation Administrative")) {
            result.sections.administrative = text;
        } else if (text.includes("Données personnelles")) {
            result.sections.personal = text;
        }
    });

    return result;
}

module.exports = { parse };
