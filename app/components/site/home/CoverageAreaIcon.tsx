import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  Factory,
  FlaskConical,
  Globe2,
  HardHat,
  HeartPulse,
  LayoutGrid,
  Package,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Truck,
  Users,
} from "lucide-react";

import type { COVERAGE_AREAS } from "@/app/content/home";

const COVERAGE_AREA_ICON_MAP: Record<(typeof COVERAGE_AREAS)[number], LucideIcon> = {
  Production: Factory,
  Packing: Package,
  Quality: ShieldCheck,
  Regulatory: Scale,
  "R&D": FlaskConical,
  Engineering: HardHat,
  "SCM and Procurement": Truck,
  IBD: Globe2,
  "Finance (GCC, Support, FP&A)": CircleDollarSign,
  "HR (TA, Payroll, Partner, Generalist, L&D)": Users,
  Clinical: Stethoscope,
  PV: ShieldAlert,
  Medical: HeartPulse,
  Others: LayoutGrid,
};

type CoverageAreaIconProps = {
  area: (typeof COVERAGE_AREAS)[number];
};

export function CoverageAreaIcon({ area }: CoverageAreaIconProps) {
  const Icon = COVERAGE_AREA_ICON_MAP[area];
  return <Icon className="po-coverage-area-icon" aria-hidden />;
}
