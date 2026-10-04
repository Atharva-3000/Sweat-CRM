import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import { Onboarding } from "@/components/onboarding";
import { requireAdmin, getBranchScope } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { memberViews, settingsOf } from "@/lib/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = await getDb();
  const scope = await getBranchScope();
  const s = settingsOf(db);

  // Compute badges for navigation
  const mViews = memberViews(db, scope);
  const alerts = mViews.filter((m) => m.display === "expired" || m.display === "expiring" || m.balanceDue > 0).length;
  const leads = db.leads.filter((l) => (scope === "all" || l.branchId === scope) && (l.status === "New" || l.status === "Contacted")).length;

  return (
    <Providers
      app={{
        gymName: s.gymName,
        countryCode: s.countryCode,
        branches: db.branches.map((b) => ({ id: b.id, name: b.name })),
      }}
    >
      {!s.onboardingComplete ? (
        <Onboarding 
          defaultGymName={s.gymName} 
          defaultOwnerName={s.ownerName} 
          defaultCountryCode={s.countryCode} 
        />
      ) : (
        <Shell scope={scope} badges={{ alerts, leads }}>
          {children}
        </Shell>
      )}
    </Providers>
  );
}
