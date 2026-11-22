import { AnnouncementBar } from "@/components/store/announcement-bar";
import { CartDrawer } from "@/components/store/cart-drawer";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import { getStoreSettings } from "@/lib/data/store";

export const revalidate = 60;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <div className="flex min-h-dvh flex-col bg-cream text-bark">
      <AnnouncementBar settings={settings} />
      <StoreHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <StoreFooter settings={settings} />
      <CartDrawer settings={settings} />
    </div>
  );
}
