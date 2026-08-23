import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding Unpop.shop database...");

  // --- Subscription plans ---------------------------------------------
  const plans = await Promise.all(
    [
      { code: "starter", name: "Starter", priceInr: 0, listingLimit: 2, description: "Try Unpop with up to 2 product listings." },
      { code: "growth", name: "Growth", priceInr: 5000, listingLimit: 5, description: "₹5,000/mo for up to 5 active product listings." },
      { code: "scale", name: "Scale", priceInr: 12000, listingLimit: 15, description: "₹12,000/mo for up to 15 active product listings." },
      { code: "enterprise", name: "Enterprise", priceInr: 30000, listingLimit: 50, description: "₹30,000/mo for up to 50 active listings plus priority RFQ matching." },
    ].map((p) => prisma.subscriptionPlan.upsert({ where: { code: p.code }, update: p, create: p }))
  );
  const growthPlan = plans.find((p) => p.code === "growth")!;

  // --- Categories --------------------------------------------------------
  const categoryNames = [
    "Food & Beverages",
    "Spices & Condiments",
    "Home & Lifestyle",
    "Handcrafted & Heritage",
    "Textiles",
    "Ayurveda & Wellness",
    "Building Materials",
  ];
  const categories: Record<string, any> = {};
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    categories[name] = await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  // --- Admin ---------------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@unpop.shop";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hash(adminPassword),
      role: "ADMIN",
      name: "Unpop Admin",
    },
  });
  console.log(`Admin login -> ${adminEmail} / ${adminPassword}`);

  // --- Demo manufacturers ---------------------------------------------------
  const manufacturersData = [
    {
      email: "sriveni@example.com",
      name: "SriVeni Naturals Team",
      companyName: "SriVeni Naturals",
      state: "Tamil Nadu",
      description: "Cold-pressed oils, organic honey and traditional South Indian condiments made in small batches.",
      certifications: "FSSAI, USDA Organic",
      exportMarkets: "UAE, UK, Singapore",
      brand: "SriVeni Naturals",
      products: [
        { name: "Tulsi Honey", categoryName: "Food & Beverages", pricePerUnit: 6.5, moq: 500, moqUnit: "kg" },
        { name: "Cold-Pressed Groundnut Oil", categoryName: "Food & Beverages", pricePerUnit: 3.2, moq: 1000, moqUnit: "litre" },
      ],
    },
    {
      email: "narpadham@example.com",
      name: "Narpadham Foods Team",
      companyName: "Narpadham Foods",
      state: "Tamil Nadu",
      description: "Organic and natural foods sourced directly from Tamil Nadu farming collectives.",
      certifications: "India Organic, FSSAI",
      exportMarkets: "Japan, USA",
      brand: "Narpadham Foods",
      products: [
        { name: "Instant Sambar Mix", categoryName: "Food & Beverages", pricePerUnit: 4.1, moq: 300, moqUnit: "kg" },
        { name: "Moringa Powder", categoryName: "Ayurveda & Wellness", pricePerUnit: 8.75, moq: 200, moqUnit: "kg" },
      ],
    },
    {
      email: "mamu@example.com",
      name: "Mamu Organic Team",
      companyName: "Mamu Organic",
      state: "Kerala",
      description: "Organic foods and raw honey harvested from the Western Ghats.",
      certifications: "FSSAI",
      exportMarkets: "UK, Germany",
      brand: "Mamu Organic",
      products: [{ name: "Raw Forest Honey", categoryName: "Food & Beverages", pricePerUnit: 7.2, moq: 400, moqUnit: "kg" }],
    },
    {
      email: "alangrahaa@example.com",
      name: "Alangrahaa Bamboo Team",
      companyName: "Alangrahaa Bamboo",
      state: "Tamil Nadu",
      description: "Handcrafted bamboo homeware and textiles made by artisan collectives.",
      certifications: "GI Tag - Tamil Nadu Bamboo Craft",
      exportMarkets: "UAE, Singapore",
      brand: "Alangrahaa Bamboo",
      products: [{ name: "Bamboo Towels", categoryName: "Home & Lifestyle", pricePerUnit: 5.4, moq: 250, moqUnit: "pieces" }],
    },
    {
      email: "athangudi@example.com",
      name: "Athangudi Tile Works Team",
      companyName: "Athangudi Tile Works",
      state: "Tamil Nadu",
      description: "Handmade cement-based Athangudi tiles using traditional Chettinad techniques.",
      certifications: "BIS",
      exportMarkets: "UK, UAE",
      brand: "Athangudi Tile Works",
      products: [{ name: "Athangudi Handmade Tiles", categoryName: "Building Materials", pricePerUnit: 12.0, moq: 100, moqUnit: "sqm" }],
    },
  ];

  const manufacturerRefs: any[] = [];

  for (const m of manufacturersData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        passwordHash: await hash("Manufacturer@123"),
        role: "MANUFACTURER",
        name: m.name,
        country: "India",
        manufacturerProfile: {
          create: {
            companyName: m.companyName,
            state: m.state,
            country: "India",
            description: m.description,
            certifications: m.certifications,
            exportMarkets: m.exportMarkets,
            verificationStatus: "VERIFIED",
            subscriptionPlanId: growthPlan.id,
            listingLimit: growthPlan.listingLimit,
          },
        },
      },
      include: { manufacturerProfile: true },
    });

    const profile = user.manufacturerProfile!;
    manufacturerRefs.push(profile);

    const brand = await prisma.brand.create({
      data: { manufacturerId: profile.id, name: m.brand, state: m.state, description: m.description },
    });

    for (const p of m.products) {
      await prisma.product.create({
        data: {
          manufacturerId: profile.id,
          brandId: brand.id,
          categoryId: categories[p.categoryName].id,
          name: p.name,
          description: `${p.name} by ${m.companyName}, sourced from ${m.state}.`,
          pricePerUnit: p.pricePerUnit,
          currency: "USD",
          moq: p.moq,
          moqUnit: p.moqUnit,
          originState: m.state,
          certifications: m.certifications,
          exportMarkets: m.exportMarkets,
          status: "ACTIVE",
        },
      });
    }
  }

  // --- Demo buyer + a bulk quote request end to end ------------------------
  const buyerUser = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      email: "buyer@example.com",
      passwordHash: await hash("Buyer@12345"),
      role: "BUYER",
      name: "Global Foods Importers",
      country: "Japan",
      buyerProfile: { create: { companyName: "Global Foods Importers", country: "Japan", city: "Tokyo" } },
    },
  });

  const moringaCategory = categories["Ayurveda & Wellness"];
  const rfq = await prisma.rFQ.create({
    data: {
      buyerId: buyerUser.id,
      productName: "Moringa Powder",
      categoryId: moringaCategory.id,
      quantity: 1,
      unit: "ton",
      destinationCountry: "Japan",
      specifications: "Food-grade, sun-dried, no additives",
      certificationsRequired: "India Organic",
      deliveryTimeline: "6 weeks",
      status: "QUOTED",
    },
  });

  const narpadham = manufacturerRefs.find((m) => m.companyName === "Narpadham Foods");
  await prisma.rFQManufacturerMatch.create({ data: { rfqId: rfq.id, manufacturerId: narpadham.id } });
  await prisma.manufacturerQuotation.create({
    data: {
      rfqId: rfq.id,
      manufacturerId: narpadham.id,
      pricePerUnit: 8500,
      currency: "USD",
      totalPrice: 8500,
      leadTimeDays: 35,
      termsNotes: "FOB Chennai, 30% advance",
      status: "SUBMITTED",
    },
  });
  await prisma.demandRecord.create({
    data: { rfqId: rfq.id, categoryId: moringaCategory.id, productName: "Moringa Powder", country: "Japan", quantity: 1, unit: "ton", source: "rfq" },
  });

  console.log("Seed complete.");
  console.log("Demo logins:");
  console.log("  Buyer:        buyer@example.com / Buyer@12345");
  console.log("  Manufacturer: sriveni@example.com / Manufacturer@123 (also narpadham@, mamu@, alangrahaa@, athangudi@)");
  console.log(`  Admin:        ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
