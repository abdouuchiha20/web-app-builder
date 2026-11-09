import type { Template } from "@/lib/types";

export const templates: Template[] = [
  {
    id: "ecommerce",
    name: "Nova Store",
    category: "E-commerce",
    description:
      "Product-led storefront with a hero, product grid, cart drawer and checkout flow.",
    prompt:
      "Build a premium e-commerce store called Nova Store for minimalist home objects. " +
      "Include: a full-bleed hero with a striking headline and one clear CTA; a curated product grid " +
      "with price, quick-add and hover motion; a slide-over cart with quantity controls; and a mock checkout. " +
      "Design direction: warm neutrals, editorial typography, generous whitespace, subtle scroll reveals. " +
      "Make it feel like a design object, not a template. Wire the cart state and product data so it is ready " +
      "to connect to a real backend.",
    swatch: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    id: "landing",
    name: "Launch",
    category: "Landing page",
    description:
      "High-conversion landing page with hero, social proof, feature blocks and a strong CTA.",
    prompt:
      "Build a high-conversion landing page for a new productivity app. " +
      "Include: a bold hero with a sharp value proposition and primary CTA; a social-proof strip; " +
      "three feature blocks with icons; a testimonial section; an FAQ; and a final CTA. " +
      "Design direction: dark, cinematic, confident type, restrained accent color, scroll-triggered motion. " +
      "Copy should be concrete and benefit-led, not generic. Structure it so sections can be swapped easily.",
    swatch: "from-violet-400 via-indigo-500 to-sky-500",
  },
];
