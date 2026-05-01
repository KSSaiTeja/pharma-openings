"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";

import type { JobsFilterOptions, JobsFilterState } from "@/src/lib/jobFilters";

function FilterCheckboxGroup({
  legend,
  name,
  options,
  selected,
  idPrefix,
}: {
  legend: string;
  name: string;
  options: string[];
  selected: string[];
  idPrefix: string;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b6880]">
        {legend}
      </legend>
      <div className="space-y-2">
        {options.map((option) => {
          const id = `${idPrefix}-${name}-${option.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <label key={option} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2 py-0.5 text-sm text-[#1e1b36]">
              <input
                id={id}
                type="checkbox"
                name={name}
                value={option}
                defaultChecked={selected.includes(option)}
                className="h-4 w-4 shrink-0 rounded border-[#d9d4ec] text-[#6d6ae8] focus-visible:ring-2 focus-visible:ring-[#6d6ae8]/40"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function buildUrlFromForm(pathname: string, form: HTMLFormElement): string {
  const formData = new FormData(form);
  const params = new URLSearchParams();
  const addMany = (key: string) => {
    const values = formData.getAll(key).map((v) => String(v).trim()).filter(Boolean);
    values.forEach((value) => params.append(key, value));
  };

  const q = String(formData.get("q") ?? "").trim();
  if (q) params.set("q", q);
  addMany("module");
  addMany("location");
  addMany("department");
  addMany("type");
  addMany("qualification");

  const posted = String(formData.get("posted") ?? "all");
  if (posted && posted !== "all") params.set("posted", posted);

  const dateFrom = String(formData.get("dateFrom") ?? "").trim();
  const dateTo = String(formData.get("dateTo") ?? "").trim();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function JobsFiltersForm({
  state,
  options,
  idPrefix,
}: {
  state: JobsFilterState;
  options: JobsFilterOptions;
  idPrefix: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceMs = useMemo(() => 400, []);

  const applyFromForm = useCallback(
    (form: HTMLFormElement) => {
      const nextUrl = buildUrlFromForm(pathname, form);
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router],
  );

  const handleFormChange = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      const target = event.target as HTMLInputElement | HTMLSelectElement;
      const isQuickSearch = target?.name === "q";

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (isQuickSearch) {
        timerRef.current = setTimeout(() => applyFromForm(form), debounceMs);
        return;
      }

      applyFromForm(form);
    },
    [applyFromForm, debounceMs],
  );

  return (
    <form method="get" className="space-y-5" onChange={handleFormChange}>
      <div className="space-y-2">
        <label htmlFor={`${idPrefix}-q`} className="text-xs font-medium tracking-wide text-[#6b6880]">
          Quick search
        </label>
        <input
          id={`${idPrefix}-q`}
          name="q"
          type="search"
          defaultValue={state.q}
          placeholder="Title, location, department, module"
          autoComplete="off"
              className="h-11 min-h-11 w-full rounded-xl border border-[#ebe7f4] bg-[#faf8ff] px-3 text-sm text-[#1e1b36] outline-none transition-[box-shadow,border-color] placeholder:text-[#6b6880]/70 focus:border-[#6d6ae8]/45 focus:ring-4 focus:ring-[#6d6ae8]/12"
        />
      </div>

      <FilterCheckboxGroup
        legend="Module"
        name="module"
        options={options.modules}
        selected={state.modules}
        idPrefix={idPrefix}
      />
      <FilterCheckboxGroup
        legend="Location"
        name="location"
        options={options.locations}
        selected={state.locations}
        idPrefix={idPrefix}
      />
      <FilterCheckboxGroup
        legend="Department"
        name="department"
        options={options.departments}
        selected={state.departments}
        idPrefix={idPrefix}
      />
      <FilterCheckboxGroup
        legend="Job type"
        name="type"
        options={options.types}
        selected={state.types}
        idPrefix={idPrefix}
      />
      <FilterCheckboxGroup
        legend="Qualification"
        name="qualification"
        options={options.qualifications}
        selected={state.qualifications}
        idPrefix={idPrefix}
      />

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b6880]">
          Posted date
        </legend>
        <div className="space-y-2 text-sm text-[#1e1b36]">
          {[
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
            { value: "all", label: "All" },
            { value: "custom", label: "Custom range" },
          ].map((preset) => {
            const rid = `${idPrefix}-posted-${preset.value}`;
            return (
              <label key={preset.value} htmlFor={rid} className="flex min-h-11 cursor-pointer items-center gap-2 py-1">
                <input
                  id={rid}
                  type="radio"
                  name="posted"
                  value={preset.value}
                  defaultChecked={state.posted === preset.value}
                  className="h-4 w-4 shrink-0 border-[#d9d4ec] text-[#6d6ae8] focus-visible:ring-2 focus-visible:ring-[#6d6ae8]/40"
                />
                <span>{preset.label}</span>
              </label>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-dateFrom`} className="text-xs text-[#6b6880]">
              From
            </label>
            <input
              id={`${idPrefix}-dateFrom`}
              type="date"
              name="dateFrom"
              defaultValue={state.dateFrom}
              className="h-11 min-h-11 w-full rounded-xl border border-[#ebe7f4] bg-[#faf8ff] px-3 text-sm text-[#1e1b36] outline-none focus:border-[#6d6ae8]/45 focus:ring-4 focus:ring-[#6d6ae8]/12"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-dateTo`} className="text-xs text-[#6b6880]">
              To
            </label>
            <input
              id={`${idPrefix}-dateTo`}
              type="date"
              name="dateTo"
              defaultValue={state.dateTo}
              className="h-11 min-h-11 w-full rounded-xl border border-[#ebe7f4] bg-[#faf8ff] px-3 text-sm text-[#1e1b36] outline-none focus:border-[#6d6ae8]/45 focus:ring-4 focus:ring-[#6d6ae8]/12"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-[#6b6880]">Filters apply automatically.</p>
        <Link
          href="/jobs"
          className="inline-flex h-11 min-h-11 items-center justify-center rounded-full border border-[#e4dff5] bg-white px-4 text-sm font-semibold text-[#6b6880] transition-[color,background-color,border-color] hover:border-[#6d6ae8]/30 hover:bg-[#faf8ff] hover:text-[#1e1b36] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
        >
          Clear all
        </Link>
      </div>
    </form>
  );
}
