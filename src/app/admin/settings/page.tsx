"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";
import { defaultStoreSettings, type StoreSettings } from "@/lib/useSiteSettings";
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const categoryNames = ["For Him", "For Her", "For Kids", "Special Occasions"];
const customNames = ["Custom Polaroid Set", "Custom Metal Art", "3D Photo Miniature", "Custom Acrylic Frame"];

export default function SettingsPage() {
  const [value, setValue] = useState<StoreSettings>(defaultStoreSettings);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/site-settings", { cache: "no-store" }).then(async (r) => {
      const settings = await r.json();
      if (!r.ok) throw new Error(settings.error || "Could not load saved settings");
      return settings;
    }).then((settings) => {
      if (active) setValue({ ...defaultStoreSettings, ...settings });
    }).catch(() => { if (active) setNote("Could not load saved settings. Check the Firebase connection."); });
    return () => { active = false; };
  }, []);

  function update<K extends keyof StoreSettings>(key: K, next: StoreSettings[K]) {
    setValue((previous) => ({ ...previous, [key]: next }));
    setNote("");
  }

  async function upload(file: File, slot: string) {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setNote("Choose an image file smaller than 8 MB.");
      return null;
    }
    setBusy(true);
    setNote(`Uploading ${file.name}…`);
    try {
      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const imageRef = ref(storage, `site-assets/${slot}/${Date.now()}-${safeName}`);
      await uploadBytes(imageRef, file);
      setNote(`${file.name} uploaded. Save changes to publish it.`);
      return await getDownloadURL(imageRef);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Image upload failed. Check Firebase Storage rules.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setNote("");
    try {
      const response = await adminFetch("/api/site-settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save settings");
      window.dispatchEvent(new CustomEvent("store-settings-updated", { detail: value }));
      setNote("Changes saved and applied to the storefront.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Store customization</h1>
        <p className="mt-1 text-gray-600">Edit each part of the storefront, then save to apply your changes.</p>
      </header>

      <Section title="Brand and layout" description="Set the store identity and choose a storefront spacing style.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" value={value.brandName} onChange={(v) => update("brandName", v)} />
          <label className="grid gap-1.5 text-sm font-medium">Theme color
            <span className="flex h-11 items-center gap-3 rounded-lg border border-gray-300 px-3"><input type="color" value={value.themeColor} onChange={(e) => update("themeColor", e.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"/><span className="font-mono text-gray-600">{value.themeColor}</span></span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Storefront layout
            <select value={value.layoutPreset} onChange={(e) => update("layoutPreset", e.target.value as StoreSettings["layoutPreset"])} className="h-11 rounded-lg border border-gray-300 bg-white px-3">
              <option value="classic">Classic</option><option value="compact">Compact</option><option value="spacious">Spacious</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="Homepage hero" description="The main heading, supporting text, and carousel images at the top of the home page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero heading" value={value.heroTitle} onChange={(v) => update("heroTitle", v)} />
          <Field label="Hero subtitle" value={value.heroSubtitle} onChange={(v) => update("heroSubtitle", v)} />
        </div>
        <ImageSlots label="Hero carousel images" names={["Slide 1", "Slide 2", "Slide 3", "Slide 4"]} values={value.heroImages} onUpload={(i, url) => update("heroImages", setSlot(value.heroImages, i, url))} upload={(file) => upload(file, "homepage-hero")} />
      </Section>

      <Section title="Homepage image sections" description="Replace the category tiles, customized gift feature, and crafting-process picture. These images were previously loading from unreliable external URLs or had no image at all.">
        <ImageSlots label="Gift category tiles" names={categoryNames} values={value.categoryImages} onUpload={(i, url) => update("categoryImages", setSlot(value.categoryImages, i, url))} upload={(file) => upload(file, "homepage-categories")} />
        <SingleImage label="Customized gift example — Make It Personal" value={value.customShowcaseImage} onChange={(url) => update("customShowcaseImage", url)} upload={(file) => upload(file, "customized-gift-example")} />
        <SingleImage label="Our Crafting Process" value={value.craftingImage} onChange={(url) => update("craftingImage", url)} upload={(file) => upload(file, "crafting-process")} />
      </Section>

      <Section title="Custom gift builder images" description="Upload an image for each product card on the /custom page. Use one image slot per item.">
        <ImageSlots label="Custom products" names={customNames} values={value.customImages} onUpload={(i, url) => update("customImages", setSlot(value.customImages, i, url))} upload={(file) => upload(file, "custom-gift-products")} />
      </Section>

      <Section title="Other website photos" description="Update the About page, team portraits, customer testimonial photos, and social gallery pictures.">
        <SingleImage label="About page feature photo" value={value.aboutImage} onChange={(url) => update("aboutImage", url)} upload={(file) => upload(file, "about-page-image")} />
        <ImageSlots label="About page team portraits" names={["Team member 1", "Team member 2", "Team member 3"]} values={value.teamImages} onUpload={(i, url) => update("teamImages", setSlot(value.teamImages, i, url))} upload={(file) => upload(file, "team-portraits")} />
        <ImageSlots label="Homepage testimonial photos" names={["Customer 1", "Customer 2", "Customer 3"]} values={value.testimonialImages} onUpload={(i, url) => update("testimonialImages", setSlot(value.testimonialImages, i, url))} upload={(file) => upload(file, "testimonial-photos")} />
        <ImageSlots label="Homepage social gallery" names={["Gallery image 1", "Gallery image 2", "Gallery image 3", "Gallery image 4", "Gallery image 5", "Gallery image 6"]} values={value.instagramImages} onUpload={(i, url) => update("instagramImages", setSlot(value.instagramImages, i, url))} upload={(file) => upload(file, "social-gallery")} />
      </Section>

      <Section title="About page" description="Edit the story shown on your storefront.">
        <Field label="About heading" value={value.aboutTitle} onChange={(v) => update("aboutTitle", v)} />
        <TextArea label="About text" value={value.aboutText} onChange={(v) => update("aboutText", v)} />
      </Section>

      <Section title="Contact and footer" description="These details appear on the contact page and across the site footer.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" value={value.contactEmail} onChange={(v) => update("contactEmail", v)} />
          <Field label="Contact phone" value={value.contactPhone} onChange={(v) => update("contactPhone", v)} />
          <TextArea label="Contact address" value={value.contactAddress} onChange={(v) => update("contactAddress", v)} />
          <TextArea label="Footer description" value={value.footerText} onChange={(v) => update("footerText", v)} />
        </div>
      </Section>

      <Section title="Social media" description="Paste full public profile links. Leave a field empty to hide that link.">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Instagram URL" value={value.instagram} onChange={(v) => update("instagram", v)} /><Field label="Facebook URL" value={value.facebook} onChange={(v) => update("facebook", v)} /><Field label="YouTube URL" value={value.youtube} onChange={(v) => update("youtube", v)} /></div>
      </Section>

      <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur">
        <p aria-live="polite" className="text-sm text-gray-600">{note || "Remember to save your changes."}</p>
        <button type="button" disabled={busy} onClick={() => void save()} className="rounded-lg bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800 disabled:cursor-wait disabled:opacity-60">{busy ? "Please wait…" : "Save and apply changes"}</button>
      </div>
    </main>
  );
}

function setSlot(values: string[], index: number, url: string) { const next = Array.from({ length: Math.max(values.length, index + 1) }, (_, i) => values[i] || ""); next[index] = url; return next; }
function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-lg font-semibold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div>{children}</section>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-lg border border-gray-300 px-3 font-normal outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-gray-300 p-3 font-normal outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>; }
function ImageSlots({ label, names, values, onUpload, upload }: { label: string; names: string[]; values: string[]; onUpload: (index: number, url: string) => void; upload: (file: File) => Promise<string | null> }) { return <div className="mt-5 space-y-3"><h3 className="text-sm font-medium text-gray-800">{label}</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{names.map((name, index) => <ImageCard key={name} name={name} value={values[index] || ""} upload={upload} onUpload={(url) => onUpload(index, url)} />)}</div></div>; }
function SingleImage({ label, value, onChange, upload }: { label: string; value: string; onChange: (url: string) => void; upload: (file: File) => Promise<string | null> }) { return <div className="mt-5"><ImageCard name={label} value={value} upload={upload} onUpload={onChange} /></div>; }
function ImageCard({ name, value, upload, onUpload }: { name: string; value: string; upload: (file: File) => Promise<string | null>; onUpload: (url: string) => void }) { const [busy, setBusy] = useState(false); return <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"><div className="flex h-36 items-center justify-center bg-gray-100">{value ? <img src={value} alt={name} className="h-full w-full object-cover" /> : <span className="px-3 text-center text-sm text-gray-400">No image selected</span>}</div><div className="space-y-2 p-3"><p className="truncate text-xs font-medium text-gray-700" title={name}>{name}</p><label className="block cursor-pointer rounded-md border bg-white px-3 py-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-100">{busy ? "Uploading…" : value ? "Replace image" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={busy} onChange={async (e) => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (!file) return; setBusy(true); try { const url = await upload(file); if (url) onUpload(url); } finally { setBusy(false); } }} /></label>{value && <button type="button" onClick={() => onUpload("")} className="w-full text-xs text-red-600 hover:underline">Remove image</button>}</div></div>; }
