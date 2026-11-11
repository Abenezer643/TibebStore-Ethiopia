import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TenantModel } from "@/models/Tenant";
import { ProductModel } from "@/models/Product";
import { UserModel } from "@/models/User";
import { hashPassword, makeSessionCookie, signSession, toSafeUser } from "@/lib/auth";

// Real Ethiopian artisan products
const REAL_PRODUCTS = [
  {
    name: "Classic Harar Tote",
    slug: "classic-harar-tote",
    description: "Handcrafted leather tote bag from the ancient city of Harar. Made from premium Ethiopian leather with traditional Harari geometric patterns embossed on the front. Features sturdy leather handles and a spacious interior lined with locally woven cotton. Each bag takes 2 weeks to craft by skilled artisans using techniques passed down through generations.",
    price: 4500,
    category: { id: "leather", name: "Leather", slug: "leather", color: "#8B4513" },
    materials: ["Ethiopian leather", "Cotton lining", "Brass hardware"],
    craftRegion: "Harar",
    images: [{ id: "harar-tote-1", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=512", alt: "Classic Harar Tote" }],
  },
  {
    name: "Traditional Mesob (Large)",
    slug: "traditional-mesob-large",
    description: "Authentic handwoven Mesob basket from the Gurage region. This large ceremonial basket is traditionally used for serving injera during special occasions. Woven from natural grasses and dyed with plant-based colors in the distinctive Gurage pattern. Each Mesob takes 3-4 weeks to complete and represents centuries of basket-weaving tradition.",
    price: 8500,
    category: { id: "baskets", name: "Baskets", slug: "baskets", color: "#DAA520" },
    materials: ["Natural grass", "Plant-based dyes", "Cotton thread"],
    craftRegion: "Gurage",
    images: [{ id: "mesob-1", url: "https://images.unsplash.com/photo-1595231305276-75a17f30e83a?w=512", alt: "Traditional Mesob" }],
  },
  {
    name: "Axum Silver Cross Necklace",
    slug: "axum-silver-cross-necklace",
    description: "Handcrafted Ethiopian Orthodox cross necklace from Axum, one of the oldest continuously inhabited cities in Africa. Made from sterling silver using ancient lost-wax casting techniques. Features the distinctive elaborate Axumite cross design, symbolizing the rich Christian heritage of Ethiopia dating back to the 4th century AD.",
    price: 12000,
    category: { id: "jewelry", name: "Jewelry", slug: "jewelry", color: "#C0C0C0" },
    materials: ["Sterling silver", "Natural patina"],
    craftRegion: "Axum",
    images: [{ id: "silver-cross-1", url: "https://images.unsplash.com/photo-1515562141207-7bdb88796940?w=512", alt: "Axum Silver Cross" }],
  },
  {
    name: "Habesha Kemis (White)",
    slug: "habesha-kemis-white",
    description: "Traditional Ethiopian dress handwoven in Addis Ababa. This elegant Habesha Kemis features delicate embroidery (tilf) along the hem and sleeves. Made from pure Ethiopian cotton using traditional weaving techniques on a pit loom. The white fabric with colorful borders represents purity and is worn during celebrations and ceremonies.",
    price: 25000,
    category: { id: "textiles", name: "Textiles", slug: "textiles", color: "#F5F5DC" },
    materials: ["Ethiopian cotton", "Embroidery thread", "Natural dyes"],
    craftRegion: "Addis Ababa",
    images: [{ id: "kemis-1", url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=512", alt: "Habesha Kemis" }],
  },
  {
    name: "Shakiso Pottery Vase",
    slug: "shakiso-pottery-vase",
    description: "Handmade terracotta vase from the pottery traditions of Shakiso in southern Ethiopia. Crafted from locally sourced clay using traditional coiling techniques passed down through generations. Features natural earth tones and a smooth finish achieved by burnishing with river stones. Perfect for displaying dried flowers or as a standalone decorative piece.",
    price: 6500,
    category: { id: "pottery", name: "Pottery", slug: "pottery", color: "#CD853F" },
    materials: ["Local clay", "Natural mineral pigments"],
    craftRegion: "Shakiso",
    images: [{ id: "vase-1", url: "https://images.unsplash.com/photo-1578749556568-20d4d0fa594b?w=512", alt: "Shakiso Pottery Vase" }],
  },
  {
    name: "Ethiopian Landscape Painting",
    slug: "ethiopian-landscape-painting",
    description: "Original oil painting depicting the stunning landscapes of the Ethiopian highlands. Created by a local artist in Addis Ababa, this piece captures the dramatic Simien Mountains at sunset with traditional tukul huts in the foreground. Painted on stretched canvas using high-quality oil paints. Each piece is signed and comes with a certificate of authenticity.",
    price: 35000,
    category: { id: "paintings", name: "Paintings", slug: "paintings", color: "#4169E1" },
    materials: ["Oil paints", "Canvas", "Wooden stretcher bars"],
    craftRegion: "Addis Ababa",
    images: [{ id: "painting-1", url: "https://images.unsplash.com/photo-1578301978692-8536bc1e1e54?w=512", alt: "Ethiopian Landscape Painting" }],
  },
  {
    name: "Harar Leather Belt",
    slug: "harar-leather-belt",
    description: "Premium leather belt handcrafted in Harar using traditional tanning methods. Made from full-grain Ethiopian leather with hand-tooled geometric patterns inspired by Harari architecture. Features a solid brass buckle cast by local metalworkers. Each belt is cut, tooled, and stitched entirely by hand, ensuring durability and unique character.",
    price: 2800,
    category: { id: "leather", name: "Leather", slug: "leather", color: "#8B4513" },
    materials: ["Full-grain Ethiopian leather", "Brass buckle", "Waxed thread"],
    craftRegion: "Harar",
    images: [{ id: "belt-1", url: "https://images.unsplash.com/photo-1624222247349-2a9c4e5ad9a9?w=512", alt: "Harar Leather Belt" }],
  },
  {
    name: "Decorative Basket Set",
    slug: "decorative-basket-set",
    description: "Set of three handwoven decorative baskets from the Gurage region. Includes small, medium, and large sizes featuring the iconic Ethiopian color palette of red, yellow, and green. Woven from sustainable grasses using ancient techniques. Perfect for home decoration, storage, or as unique gift items. Each set supports women artisans in rural Ethiopia.",
    price: 4500,
    category: { id: "baskets", name: "Baskets", slug: "baskets", color: "#DAA520" },
    materials: ["Natural grass", "Plant-based dyes"],
    craftRegion: "Gurage",
    images: [{ id: "basket-set-1", url: "https://images.unsplash.com/photo-1610557892420-0fb7f4af53aa?w=512", alt: "Decorative Basket Set" }],
  },
];

export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Create or get seller user
  const sellerEmail = "seller@tibebstore.com";
  const sellerPassword = "Seller2024";
  let seller = await UserModel.findOne({ email: sellerEmail });

  if (!seller) {
    const passwordHash = await hashPassword(sellerPassword);
    seller = await UserModel.create({
      email: sellerEmail,
      username: "ethiopianartisans",
      passwordHash,
      role: "seller",
      sellerStatus: "approved",
      isSuspended: false,
    });
  }

  // Create or get tenant
  let tenant = await TenantModel.findOne({ ownerId: String((seller as any)._id) });

  if (!tenant) {
    tenant = await TenantModel.create({
      name: "Ethiopian Artisans Collective",
      slug: "ethiopian-artisans",
      description: "Authentic handcrafted treasures from master artisans across Ethiopia. Each piece tells a story of tradition, skill, and cultural heritage.",
      isDisabled: false,
      ownerId: String((seller as any)._id),
      stripeDetailsSubmitted: false,
    });
  }

  // Create products
  const results: Array<{ name: string; action: string }> = [];

  for (const productData of REAL_PRODUCTS) {
    const existing = await ProductModel.findOne({ slug: productData.slug });

    if (existing) {
      results.push({ name: productData.name, action: "skipped (exists)" });
      continue;
    }

    await ProductModel.create({
      tenantId: (tenant as any)._id,
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      materials: productData.materials.join(", "),
      craftRegion: productData.craftRegion,
      images: productData.images,
      isArchived: false,
      isPrivate: false,
    });

    results.push({ name: productData.name, action: "created" });
  }

  const productCount = await ProductModel.countDocuments({ tenantId: (tenant as any)._id });

  return NextResponse.json({
    ok: true,
    message: "Real Ethiopian artisan products seeded successfully",
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
    },
    seller: {
      email: sellerEmail,
      password: sellerPassword,
    },
    products: results,
    totalProducts: productCount,
  });
}
