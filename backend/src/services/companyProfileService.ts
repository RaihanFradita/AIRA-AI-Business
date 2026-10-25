import { sql } from "../database/db";

export type CompanyProfileInput = {
  name: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxId: string;
};

const EMPTY_PROFILE: CompanyProfileInput = {
  name: "",
  industry: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  taxId: "",
};

export const companyProfileService = {
  async get() {
    const [profile] = await sql`
      SELECT name, industry, email, phone, website, address, tax_id AS "taxId", updated_at AS "updatedAt"
      FROM company_profile WHERE id = 1`;
    return profile ?? { ...EMPTY_PROFILE, updatedAt: null };
  },
  async update(profile: CompanyProfileInput) {
    const [saved] = await sql`
      INSERT INTO company_profile (id, name, industry, email, phone, website, address, tax_id, updated_at)
      VALUES (1, ${profile.name}, ${profile.industry}, ${profile.email}, ${profile.phone},
        ${profile.website}, ${profile.address}, ${profile.taxId}, now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        industry = EXCLUDED.industry,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        website = EXCLUDED.website,
        address = EXCLUDED.address,
        tax_id = EXCLUDED.tax_id,
        updated_at = now()
      RETURNING name, industry, email, phone, website, address, tax_id AS "taxId", updated_at AS "updatedAt"`;
    return saved;
  },
};
