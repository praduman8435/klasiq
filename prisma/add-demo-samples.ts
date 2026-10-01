/**
 * Demo samples for trying the For-schools sample book and uniform
 * designer. Every one has a code starting "DEMO-", so they're easy to
 * spot in Admin → Sample book and to remove in one go.
 *
 *   npx tsx prisma/add-demo-samples.ts            # add (skips ones already there)
 *   npx tsx prisma/add-demo-samples.ts --remove   # delete every DEMO- sample
 */
import { PrismaClient, type UniformSampleKind, type UniformSamplePattern } from "@prisma/client";

const db = new PrismaClient();

type Demo = {
  code: string;
  name: string;
  kind: UniformSampleKind;
  pattern?: UniformSamplePattern;
  colourHex: string;
  accentHex?: string;
  description: string;
};

const SAMPLES: Demo[] = [
  // Shirts
  { code: "DEMO-SH1", name: "White poplin", kind: "SHIRT", colourHex: "#f6f6f2", description: "Poly-cotton, easy to wash, holds a crisp collar." },
  { code: "DEMO-SH2", name: "Sky blue oxford", kind: "SHIRT", colourHex: "#bcd3ee", description: "Soft oxford weave, good for summer." },
  { code: "DEMO-SH3", name: "Cream cotton", kind: "SHIRT", colourHex: "#efe6cf", description: "Breathable cotton blend." },
  { code: "DEMO-SH4", name: "Light grey check", kind: "SHIRT", pattern: "CHECK", colourHex: "#e4e6ea", accentHex: "#9aa3b2", description: "Small check, hides everyday marks." },
  { code: "DEMO-SH5", name: "Blue pinstripe", kind: "SHIRT", pattern: "STRIPE", colourHex: "#e9f0fa", accentHex: "#6f8fc4", description: "Fine stripe for senior classes." },
  // Pants
  { code: "DEMO-PT1", name: "Navy twill", kind: "PANT", colourHex: "#1f2a44", description: "Durable twill, keeps its crease." },
  { code: "DEMO-PT2", name: "Charcoal grey", kind: "PANT", colourHex: "#3d4250", description: "Terry-rayon, soft and strong." },
  { code: "DEMO-PT3", name: "Grey mixture", kind: "PANT", colourHex: "#6b707c", description: "Classic mixture grey." },
  { code: "DEMO-PT4", name: "Khaki", kind: "PANT", colourHex: "#a68f63", description: "Light khaki, popular for primary classes." },
  // Skirts
  { code: "DEMO-SK1", name: "Navy check", kind: "SKIRT", pattern: "CHECK", colourHex: "#1f2a44", accentHex: "#b8c4dc", description: "Box-pleat skirt fabric." },
  { code: "DEMO-SK2", name: "Maroon check", kind: "SKIRT", pattern: "CHECK", colourHex: "#6d1f2c", accentHex: "#d9a7ae", description: "Warm maroon check." },
  { code: "DEMO-SK3", name: "Grey plain", kind: "SKIRT", colourHex: "#5d626e", description: "Plain grey, matches grey pants." },
  { code: "DEMO-SK4", name: "Bottle green check", kind: "SKIRT", pattern: "CHECK", colourHex: "#1f4d3a", accentHex: "#a9cdb9", description: "Green check for green-themed schools." },
  // Ties
  { code: "DEMO-TI1", name: "Maroon and gold stripe", kind: "TIE", pattern: "STRIPE", colourHex: "#7a1f2b", accentHex: "#d9b44a", description: "Ready-knot or full tie." },
  { code: "DEMO-TI2", name: "Navy and red stripe", kind: "TIE", pattern: "STRIPE", colourHex: "#1f2a44", accentHex: "#c0392b", description: "Ready-knot or full tie." },
  { code: "DEMO-TI3", name: "Green and yellow stripe", kind: "TIE", pattern: "STRIPE", colourHex: "#1f4d3a", accentHex: "#e8c547", description: "Ready-knot or full tie." },
  { code: "DEMO-TI4", name: "Plain navy", kind: "TIE", colourHex: "#1c2540", description: "Logo can be printed or embroidered." },
  // Belts
  { code: "DEMO-BT1", name: "Black elastic", kind: "BELT", colourHex: "#16181d", description: "Elastic belt with metal buckle; logo buckle on order." },
  { code: "DEMO-BT2", name: "Navy elastic", kind: "BELT", colourHex: "#1f2a44", description: "Elastic belt with metal buckle." },
  // Sweaters
  { code: "DEMO-SW1", name: "Navy V-neck", kind: "SWEATER", colourHex: "#26304a", description: "Acrylic knit, full sleeves." },
  { code: "DEMO-SW2", name: "Maroon V-neck", kind: "SWEATER", colourHex: "#5e1d27", description: "Acrylic knit, full sleeves." },
  { code: "DEMO-SW3", name: "Bottle green V-neck", kind: "SWEATER", colourHex: "#1f4d3a", description: "Acrylic knit, full sleeves." },
  // Blazers
  { code: "DEMO-BZ1", name: "Navy blazer", kind: "BLAZER", colourHex: "#1f2a44", description: "Terry-wool blend; school badge embroidery." },
  { code: "DEMO-BZ2", name: "Bottle green blazer", kind: "BLAZER", colourHex: "#1f4d3a", description: "Terry-wool blend; school badge embroidery." },
  { code: "DEMO-BZ3", name: "Maroon blazer", kind: "BLAZER", colourHex: "#5e1d27", description: "Terry-wool blend; school badge embroidery." },
  // Socks
  { code: "DEMO-SO1", name: "White socks", kind: "SOCKS", colourHex: "#f4f5f7", description: "Cotton-rich, ribbed." },
  { code: "DEMO-SO2", name: "Navy socks", kind: "SOCKS", colourHex: "#1f2a44", description: "Cotton-rich, ribbed." },
  { code: "DEMO-SO3", name: "Grey socks", kind: "SOCKS", colourHex: "#6b707c", description: "Cotton-rich, ribbed." },
  // Shoes
  { code: "DEMO-FW1", name: "Black school shoes", kind: "SHOES", colourHex: "#15171c", description: "Lace-up, polishable, non-slip sole." },
  { code: "DEMO-FW2", name: "Brown leather", kind: "SHOES", colourHex: "#5a3a24", description: "Brown lace-up for senior classes." },
  { code: "DEMO-FW3", name: "White canvas sneakers", kind: "SHOES", colourHex: "#eceef1", description: "For PT days and sports." },
  { code: "DEMO-FW4", name: "Black sneakers", kind: "SHOES", colourHex: "#22252c", description: "Velcro or lace-up, all-day comfort." },
  // House / sports T-shirts (sample book only)
  { code: "DEMO-TS1", name: "Red house T-shirt", kind: "TSHIRT", colourHex: "#c0392b", description: "Dri-fit, for sports day and house events." },
  { code: "DEMO-TS2", name: "Blue house T-shirt", kind: "TSHIRT", colourHex: "#2e64c9", description: "Dri-fit, for sports day and house events." },
  { code: "DEMO-TS3", name: "Green house T-shirt", kind: "TSHIRT", colourHex: "#2e8b57", description: "Dri-fit, for sports day and house events." },
  { code: "DEMO-TS4", name: "Yellow house T-shirt", kind: "TSHIRT", colourHex: "#e8c547", description: "Dri-fit, for sports day and house events." },
];

async function main() {
  if (process.argv.includes("--remove")) {
    const removed = await db.uniformSample.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
    console.log(`removed ${removed.count} demo samples`);
    return;
  }
  let added = 0;
  for (const [index, sample] of SAMPLES.entries()) {
    const exists = await db.uniformSample.findFirst({ where: { code: sample.code } });
    if (exists) continue;
    await db.uniformSample.create({
      data: {
        ...sample,
        pattern: sample.pattern ?? "PLAIN",
        accentHex: sample.accentHex ?? null,
        sortOrder: index,
        isActive: true,
      },
    });
    added++;
  }
  console.log(`added ${added} demo samples (${SAMPLES.length - added} were already there)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
