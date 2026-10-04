import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import { Onboarding } from "@/components/onboarding";
import { requireAdmin, getBranchScope } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { memberViews, settingsOf } from "@/lib/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const scope = await getBranchScope();
  const s = await settingsOf();

  // Compute badges for navigation
  const mViews = await memberViews(scope);
  const alerts = mViews.filter((m) => m.display === "expired" || m.display === "expiring" || m.balanceDue > 0).length;
  
  let leadsQuery = supabase.from('leads').select('*').in('status', ['New', 'Contacted']);
  if (scope !== "all") leadsQuery = leadsQuery.eq('branchId', scope);
  const { data: leadsData } = await leadsQuery;
  const leads = (leadsData || []).length;
  
  const { data: branchesData } = await supabase.from('branches').select('id, name');
  const branches = branchesData || [];

  return (
    <Providers
      app={{
        gymName: s.gymName,
        countryCode: s.countryCode,
        branches: branches,
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
