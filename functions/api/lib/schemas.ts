import { z } from "zod";

const emptyToNull = (v: unknown) => {
  if (typeof v !== "string") return v;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
};

const optionalText = z.preprocess(
  emptyToNull,
  z.string().max(500, "Trop long (500 caractères max)").nullable().optional(),
);

const optionalLongText = z.preprocess(
  emptyToNull,
  z.string().max(5000, "Trop long (5000 caractères max)").nullable().optional(),
);

const optionalEmail = z.preprocess(
  emptyToNull,
  z.string().email("Email invalide").nullable().optional(),
);

const optionalIsoDate = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format AAAA-MM-JJ attendu")
    .nullable()
    .optional(),
);

const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(20, "Maximum 20 tags")
  .default([]);

export const clientInputSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(100, "Trop long"),
  last_name: z.string().trim().min(1, "Nom requis").max(100, "Trop long"),
  email: optionalEmail,
  phone: optionalText,
  address_line1: optionalText,
  address_line2: optionalText,
  postal_code: optionalText,
  city: optionalText,
  country: optionalText,
  birth_date: optionalIsoDate,
  preferences: optionalLongText,
  tags: tagsSchema.optional(),
  notes: optionalLongText,
});

export type ClientInputData = z.infer<typeof clientInputSchema>;

export const clientQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  tag: z.string().trim().optional().default(""),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ClientQueryData = z.infer<typeof clientQuerySchema>;
