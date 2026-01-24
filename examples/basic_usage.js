/**
 * Example usage of the SchoolAppClient
 */
import { SchoolAppClient } from '../index.js';

async function main() {
    // Initialize client
    const client = new SchoolAppClient();

    // Login credentials
    const email = "[EMAIL]";
    const password = "[PASSWORD]";

    if (await client.login(email, password)) {
        console.log("\n✓ Login successful!\n");

        // Get profile
        const profile = await client.getFilieres()
        console.log(profile)
        // Get current element grades
        const currentGrades = await client.getCurrentElemNote();
        if (currentGrades && currentGrades.length > 0) {
            console.log("Current Element Grades:");
            for (const grade of currentGrades) {
                console.log(`${grade.CodeElem}: ${grade.Moy ?? 'N/A'}`);
            }
            console.log();

            // Get statistics for the first element
            if (currentGrades[0]) {
                console.log(`Getting statistics for ${currentGrades[0].CodeElem}...`);
                const stats = await currentGrades[0].moyStats();
                if (stats) {
                    console.log('Statistics:', stats);
                }
                console.log();
            }
        }

        // Get absences
        const absences = await client.getAbsences();
        if (absences) {
            console.log("Absences Summary:");
            if (absences.summary && absences.summary.length > 0) {
                for (const item of absences.summary) {
                    console.log(`${item.CodeElem}: ${item.Non_Justifiee} unjustified, ${item.Justifiee} justified`);
                }
            }
            console.log();
        }

        // Get filieres
        const filieres = await client.getFilieres();
        if (filieres && filieres.length > 0) {
            console.log("✓ Fetched filieres successfully");
            console.log(`Found ${filieres.length} programs`);
            console.log();
        }

        // Get modules for specific niveau/filiere/semestre
        // Note: Adjust these values to match your actual data
        const modules = await client.getModules("1A", "API-MPT", "S1");
        if (modules && Object.keys(modules).length > 0) {
            console.log("✓ Fetched modules successfully");
            console.log(`Found ${Object.keys(modules).length} modules`);

            // Display first module
            const firstModuleCode = Object.keys(modules)[0];
            const firstModule = modules[firstModuleCode];
            console.log(`\nFirst module: ${firstModuleCode}`);
            console.log(`Title: ${firstModule.intitule}`);
            console.log(`Elements: ${firstModule.elements.length}`);
        }

    } else {
        console.log("✗ Login failed!");
    }
}

// Run the example
main().catch(error => {
    console.error("Error:", error);
    process.exit(1);
});
