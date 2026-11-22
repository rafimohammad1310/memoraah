"use client";
import { useEffect, useState } from "react";

export type StoreSettings = {
  brandName: string; themeColor: string; layoutPreset: "classic" | "compact" | "spacious";
  heroTitle: string; heroSubtitle: string; heroImages: string[]; categoryImages: string[];
  customShowcaseImage: string; craftingImage: string; customImages: string[];
  aboutImage: string; teamImages: string[]; testimonialImages: string[]; instagramImages: string[];
  aboutTitle: string; aboutText: string; contactEmail: string; contactPhone: string;
  contactAddress: string; footerText: string; instagram: string; facebook: string; youtube: string;
};

export const defaultStoreSettings: StoreSettings = {
  brandName: "Memoraah", themeColor: "#996fd6", layoutPreset: "classic",
  heroTitle: "Thoughtful Gifts, Endless Smiles", heroSubtitle: "Handcrafted gifts that tell your story.",
  heroImages: ["/bgwpolraids.png"],
  categoryImages: ["/image1.png", "/image2.png", "/bgwpolraids.png", "/about-image.png"],
  customShowcaseImage: "/image2.png", craftingImage: "/about-image.png", customImages: [],
  aboutImage: "/about-image.png", teamImages: ["/team1.jpeg", "/team11.jpeg", "/team21.jpeg"],
  testimonialImages: ["/team1.jpeg", "/team11.jpeg", "/team21.jpeg"],
  instagramImages: ["/image1.png", "/image2.png", "/about-image.png", "/bgwpolraids.png", "/team1.jpeg", "/team21.jpeg"],
  aboutTitle: "Gifts made with love", aboutText: "We help you celebrate life's most meaningful moments.",
  contactEmail: "connect@memoraah.in", contactPhone: "", contactAddress: "",
  footerText: "Curated, handcrafted products that tell a story.", instagram: "", facebook: "", youtube: "",
};

let cachedSettings: StoreSettings | null = null;
let settingsRequest: Promise<StoreSettings> | null = null;

function fetchSettings() {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (!settingsRequest) settingsRequest = fetch("/api/site-settings").then(async (response) => {
    if (!response.ok) throw new Error("Store settings request failed");
    const merged: StoreSettings = { ...defaultStoreSettings, ...await response.json() };
    cachedSettings = merged;
    return merged;
  }).finally(() => { settingsRequest = null; });
  return settingsRequest;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<StoreSettings>(cachedSettings || defaultStoreSettings);
  useEffect(() => {
    let active = true;
    void fetchSettings().then((next) => { if (active) setSettings(next); }).catch(() => {});
    const update = (event: Event) => {
      const next = (event as CustomEvent<StoreSettings>).detail;
      cachedSettings = next;
      setSettings(next);
    };
    window.addEventListener("store-settings-updated", update);
    return () => { active = false; window.removeEventListener("store-settings-updated", update); };
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--store-theme", settings.themeColor);
    document.documentElement.dataset.storeLayout = settings.layoutPreset;
  }, [settings.themeColor, settings.layoutPreset]);
  return settings;
}
