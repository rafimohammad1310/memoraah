import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";

const defaults = {
  brandName: "Memoraah", themeColor: "#996fd6", layoutPreset: "classic",
  heroTitle: "Thoughtful Gifts, Endless Smiles", heroSubtitle: "Handcrafted gifts that tell your story.",
  heroImages: ["/bgwpolraids.png"],
  categoryImages: ["/image1.png", "/image2.png", "/bgwpolraids.png", "/about-image.png"],
  customShowcaseImage: "/image2.png", craftingImage: "/about-image.png", customImages: [] as string[],
  aboutImage: "/about-image.png", teamImages: ["/team1.jpeg", "/team11.jpeg", "/team21.jpeg"],
  testimonialImages: ["/team1.jpeg", "/team11.jpeg", "/team21.jpeg"],
  instagramImages: ["/image1.png", "/image2.png", "/about-image.png", "/bgwpolraids.png", "/team1.jpeg", "/team21.jpeg"],
  aboutTitle: "Gifts made with love", aboutText: "We help you celebrate life's most meaningful moments.",
  contactEmail: "connect@memoraah.in", contactPhone: "", contactAddress: "",
  footerText: "Curated, handcrafted products that tell a story.", instagram: "", facebook: "", youtube: "",
};

export async function GET() {
  try {
    const snapshot = await adminDb.collection("siteSettings").doc("main").get();
    return NextResponse.json({ ...defaults, ...(snapshot.exists ? snapshot.data() : {}) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not read store settings", error);
    return NextResponse.json({ error: "Could not load store settings" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json() as Record<string, unknown>;
    const settings: Record<string, unknown> = {};
    for (const key of Object.keys(defaults)) if (key in body) settings[key] = body[key];
    if (typeof settings.themeColor === "string" && !/^#[\da-f]{6}$/i.test(settings.themeColor)) {
      return NextResponse.json({ error: "Theme color must be a six digit hex color" }, { status: 400 });
    }
    if (settings.layoutPreset && !["classic", "compact", "spacious"].includes(String(settings.layoutPreset))) {
      return NextResponse.json({ error: "Choose a valid layout preset" }, { status: 400 });
    }
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string" && value.length > 3000) return NextResponse.json({ error: `${key} is too long` }, { status: 400 });
      if (Array.isArray(value) && (value.length > 8 || value.some((item) => typeof item !== "string" || item.length > 2048))) {
        return NextResponse.json({ error: `${key} contains invalid image entries` }, { status: 400 });
      }
    }
    await adminDb.collection("siteSettings").doc("main").set(settings, { merge: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not save site settings" }, { status: 400 });
  }
}
