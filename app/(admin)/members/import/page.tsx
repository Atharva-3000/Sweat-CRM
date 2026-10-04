import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ImportClient } from "./import-client";

export const metadata = { title: "Import Members" };

export default async function ImportMembersPage() {
  await requireAdmin();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Import Members" 
        subtitle="Upload a spreadsheet to bulk import existing members into Sweat CRM." 
      />
      <ImportClient />
    </div>
  );
}
