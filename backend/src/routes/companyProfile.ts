import { Elysia, t } from "elysia";
import { authPlugin } from "../middleware/auth";
import { companyProfileService } from "../services/companyProfileService";

const profile = t.Object({
  name: t.String({ maxLength: 160 }),
  industry: t.String({ maxLength: 120 }),
  email: t.String({ maxLength: 254 }),
  phone: t.String({ maxLength: 40 }),
  website: t.String({ maxLength: 255 }),
  address: t.String({ maxLength: 500 }),
  taxId: t.String({ maxLength: 80 }),
});

export const companyProfileRoutes = new Elysia({ prefix: "/company-profile" })
  .use(authPlugin)
  .get("/", () => companyProfileService.get(), { role: true })
  .put("/", ({ body }) => companyProfileService.update(body), { role: ["admin"], body: profile });
