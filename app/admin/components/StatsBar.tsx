import { Briefcase, ClipboardList, Sparkles, UserPlus, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export type AdminStats = {
  totalApplications: number;
  activeJobs: number;
  newToday: number;
  shortlisted: number;
  talentPool: number;
  thisWeek: number;
};

function StatItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-zinc-200 shadow-none dark:border-zinc-800">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsBar({ stats }: { stats: AdminStats | null }) {
  const s = stats ?? {
    totalApplications: 0,
    activeJobs: 0,
    newToday: 0,
    shortlisted: 0,
    talentPool: 0,
    thisWeek: 0,
  };
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <StatItem label="Total applications" value={s.totalApplications} icon={ClipboardList} />
      <StatItem label="Active jobs" value={s.activeJobs} icon={Briefcase} />
      <StatItem label="New today" value={s.newToday} icon={Sparkles} />
      <StatItem label="Shortlisted" value={s.shortlisted} icon={Users} />
      <StatItem label="Talent pool" value={s.talentPool} icon={UserPlus} />
      <StatItem label="This week" value={s.thisWeek} icon={ClipboardList} />
    </div>
  );
}
