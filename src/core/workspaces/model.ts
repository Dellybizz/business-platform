export const workspaceTypes = [
  "commerce_business",
  "business_showcase",
  "cv",
  "portfolio",
] as const;

export type WorkspaceType = (typeof workspaceTypes)[number];

export const capabilities = [
  "website",
  "catalog",
  "checkout",
  "pos",
  "services",
  "portfolio",
  "blog",
  "bookings",
] as const;

export type Capability = (typeof capabilities)[number];

export type StarterPage = { slug: string; title: string };

export type WorkspacePreset = {
  label: string;
  description: string;
  requiresBusinessCategory: boolean;
  capabilities: readonly Capability[];
  starterPages: readonly StarterPage[];
};

export const workspacePresets: Record<WorkspaceType, WorkspacePreset> = {
  commerce_business: {
    label: "Sell online and in person",
    description: "One shared catalog for your online store and point of sale.",
    requiresBusinessCategory: true,
    capabilities: ["website", "catalog", "checkout", "pos"],
    starterPages: [
      { slug: "home", title: "Home" },
      { slug: "shop", title: "Shop" },
      { slug: "about", title: "About" },
      { slug: "contact", title: "Contact" },
    ],
  },
  business_showcase: {
    label: "Showcase a business",
    description: "Present services, capture enquiries and accept bookings.",
    requiresBusinessCategory: true,
    capabilities: ["website", "services", "bookings", "blog"],
    starterPages: [
      { slug: "home", title: "Home" },
      { slug: "services", title: "Services" },
      { slug: "about", title: "About" },
      { slug: "contact", title: "Contact" },
    ],
  },
  cv: {
    label: "Create a CV",
    description: "Publish experience, skills and achievements in a focused personal site.",
    requiresBusinessCategory: false,
    capabilities: ["website", "portfolio"],
    starterPages: [
      { slug: "home", title: "Profile" },
      { slug: "experience", title: "Experience" },
      { slug: "contact", title: "Contact" },
    ],
  },
  portfolio: {
    label: "Create a portfolio",
    description: "Show selected work, case studies and your professional story.",
    requiresBusinessCategory: false,
    capabilities: ["website", "portfolio", "blog"],
    starterPages: [
      { slug: "home", title: "Home" },
      { slug: "work", title: "Work" },
      { slug: "about", title: "About" },
      { slug: "contact", title: "Contact" },
    ],
  },
};

export function isWorkspaceType(value: unknown): value is WorkspaceType {
  return typeof value === "string" && workspaceTypes.includes(value as WorkspaceType);
}

export function isCapability(value: unknown): value is Capability {
  return typeof value === "string" && capabilities.includes(value as Capability);
}

export function legacyModeFor(type: WorkspaceType) {
  if (type === "commerce_business") return "store";
  if (type === "business_showcase") return "services";
  return "portfolio";
}

export function starterSectionsFor(type: WorkspaceType, page: StarterPage) {
  const preset = workspacePresets[type];
  return [
    {
      id: `starter-${page.slug}-hero`,
      type: "hero",
      settings: {
        eyebrow: preset.label,
        heading: page.slug === "home" ? "Welcome to your new website" : page.title,
        body: page.slug === "home"
          ? "Use the visual editor to make this page your own, then publish when you are ready."
          : `Introduce your ${page.title.toLowerCase()} content here.`,
        button: page.slug === "home" ? "Explore" : "Get in touch",
        background: "#eef3ec",
      },
      blocks: [],
    },
  ];
}
