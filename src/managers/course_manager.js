/**
 * Manager for courses and study plans
 */
import { BaseManager } from "./base_manager.js";
import { MODULES_URL } from "../constants.js";
import * as parsers from "../parsers/index.js";

export class CourseManager extends BaseManager {
  async getModules(niveau, filiere, semestre, refreshCsrf = false) {
    // 🔒 Auth guard
    this.ensureLoggedIn();
    await this.guardAuth();

    /* ----------------------- OPEN MODULES PAGE ----------------------- */

    const page = await this.httpClient.get(MODULES_URL);

    if (!page?.content || typeof page.content !== "string") {
      throw new Error("UNAUTHORIZED");
    }

    this.auth.updateCsrfToken(page.content);

    if (refreshCsrf) {
      await this.auth.refreshCsrfFromUrl(MODULES_URL);
    }

    /* ----------------------- SUBMIT FORM ----------------------------- */

    const payload = {
      _csrf: this.auth.csrfToken,
      niveau,
      filiere,
      semestre,
    };

    const response = await this.httpClient.post(
      MODULES_URL,
      payload,
      MODULES_URL
    );

    if (!response?.content || typeof response.content !== "string") {
      throw new Error("UNAUTHORIZED");
    }

    return parsers.modules.parse(response.content);
  }
}
