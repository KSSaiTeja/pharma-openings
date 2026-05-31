import { Briefcase, ClipboardList, Sparkles, UserPlus, Users } from "lucide-react";

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
    <article className="po-admin-stat">
      <div className="po-admin-stat__icon" aria-hidden>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="po-admin-stat__label">{label}</p>
        <p className="po-admin-stat__value">{value.toLocaleString()}</p>
      </div>
    </article>
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
    <div className="po-admin-stats">
      <StatItem label="Total applications" value={s.totalApplications} icon={ClipboardList} />
      <StatItem label="Active jobs" value={s.activeJobs} icon={Briefcase} />
      <StatItem label="New today" value={s.newToday} icon={Sparkles} />
      <StatItem label="Shortlisted" value={s.shortlisted} icon={Users} />
      <StatItem label="Talent pool" value={s.talentPool} icon={UserPlus} />
      <StatItem label="This week" value={s.thisWeek} icon={ClipboardList} />
    </div>
  );
}
