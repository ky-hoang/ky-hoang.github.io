/*
  The fields every project must have.

  Each project is a folder in src/content/projects/ with an index.md inside.
  The block at the top of that file is checked against this list when the
  site builds. A missing field, a misspelled field name or a wrong value
  stops the build with a message naming the file and the field.
*/

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "*/index.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.strictObject({
      // Required
      title: z.string(),
      date: z.coerce.date(), // YYYY-MM-DD; sets the year group and the order
      type: z.enum(["personal", "class", "hackathon", "club"]),
      summary: z.string(), // one sentence, shown in the home page list

      // Optional
      stack: z.array(z.string()).default([]),
      cover: image().optional(), // e.g. ./cover.png, a file in the same folder
      coverAlt: z.string().optional(), // what the cover shows, for screen readers
      links: z
        .strictObject({
          code: z.url().optional(),
          demo: z.url().optional(),
          video: z.url().optional(),
        })
        .default({}),
      draft: z.boolean().default(false), // true hides it from the live site
    }),
});

export const collections = { projects };
