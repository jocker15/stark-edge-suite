import { z } from "zod";

export const productFormSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ru: z.string().min(1, "Russian name is required"),
  description_en: z.string().optional(),
  description_ru: z.string().optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  sku: z.string().optional(),
  
  price: z.number().min(0, "Price must be positive"),
  old_price: z.number().min(0, "Old price must be positive").optional().nullable(),
  currency: z.enum(["USD", "EUR", "RUB"]).default("USD"),
  
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  
  is_digital: z.boolean().default(true),
  file_url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  external_url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  download_limit: z.number().int().min(0).optional().nullable(),
  
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  document_type: z.string().optional().nullable(),
  
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  stock: z.number().int().min(0).default(1000),
  
  meta_title: z.string().max(60, "Meta title should not exceed 60 characters").optional(),
  meta_description: z.string().max(160, "Meta description should not exceed 160 characters").optional(),
  
  image_urls: z.array(z.string()).default([]),
  gallery_urls: z.array(z.string()).default([]),
  preview_link: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const productFormErrorMessages = {
  en: {
    name_en: "English name is required",
    name_ru: "Russian name is required",
    slug: "Slug is required and must contain only lowercase letters, numbers, and hyphens",
    price: "Price must be a positive number",
    old_price: "Old price must be a positive number",
    file_url: "Invalid URL",
    external_url: "Invalid URL",
    preview_link: "Invalid URL",
    meta_title: "Meta title should not exceed 60 characters",
    meta_description: "Meta description should not exceed 160 characters",
  },
  ru: {
    name_en: "Требуется название на английском",
    name_ru: "Требуется название на русском",
    slug: "Требуется слаг, который может содержать только строчные буквы, цифры и дефисы",
    price: "Цена должна быть положительным числом",
    old_price: "Старая цена должна быть положительным числом",
    file_url: "Неверный URL",
    external_url: "Неверный URL",
    preview_link: "Неверный URL",
    meta_title: "Мета-заголовок не должен превышать 60 символов",
    meta_description: "Мета-описание не должно превышать 160 символов",
  },
};
