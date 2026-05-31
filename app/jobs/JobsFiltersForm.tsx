"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

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
    <fieldset className="po-jobs-filter__group">
      <legend className="po-jobs-filter__legend">{legend}</legend>
      <ul className="po-jobs-filter__options">
        {options.map((option) => {
          const id = `${idPrefix}-${name}-${option.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <li key={option}>
              <label htmlFor={id} className="po-jobs-filter__option">
                <input
                  id={id}
                  type="checkbox"
                  name={name}
                  value={option}
                  defaultChecked={selected.includes(option)}
                  className="po-jobs-filter__checkbox"
                />
                <span>{option}</span>
              </label>
            </li>
          );
        })}
      </ul>
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
  const [postedPreset, setPostedPreset] = useState(state.posted);
  const showCustomDates = postedPreset === "custom" || Boolean(state.dateFrom || state.dateTo);

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

      if (target?.name === "posted" && target instanceof HTMLInputElement) {
        const next = target.value;
        if (next === "7d" || next === "30d" || next === "all" || next === "custom") {
          setPostedPreset(next);
        }
      }

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
    <form method="get" className="po-jobs-filter__form" onChange={handleFormChange}>
      <div className="po-jobs-filter__field">
        <label htmlFor={`${idPrefix}-q`} className="po-jobs-filter__label">
          Search
        </label>
        <input
          id={`${idPrefix}-q`}
          name="q"
          type="search"
          defaultValue={state.q}
          placeholder="Role, location, department…"
          autoComplete="off"
          className="po-jobs-filter__input"
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

      <fieldset className="po-jobs-filter__group">
        <legend className="po-jobs-filter__legend">Posted date</legend>
        <ul className="po-jobs-filter__options">
          {[
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
            { value: "all", label: "All time" },
            { value: "custom", label: "Custom range" },
          ].map((preset) => {
            const rid = `${idPrefix}-posted-${preset.value}`;
            return (
              <li key={preset.value}>
                <label htmlFor={rid} className="po-jobs-filter__option">
                  <input
                    id={rid}
                    type="radio"
                    name="posted"
                    value={preset.value}
                    defaultChecked={state.posted === preset.value}
                    className="po-jobs-filter__radio"
                  />
                  <span>{preset.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {showCustomDates ? (
          <div className="po-jobs-filter__dates">
            <div className="po-jobs-filter__date-block">
              <label htmlFor={`${idPrefix}-dateFrom`} className="po-jobs-filter__label po-jobs-filter__label--sub">
                From
              </label>
              <input
                id={`${idPrefix}-dateFrom`}
                type="date"
                name="dateFrom"
                defaultValue={state.dateFrom}
                className="po-jobs-filter__input po-jobs-filter__input--date"
              />
            </div>
            <div className="po-jobs-filter__date-block">
              <label htmlFor={`${idPrefix}-dateTo`} className="po-jobs-filter__label po-jobs-filter__label--sub">
                To
              </label>
              <input
                id={`${idPrefix}-dateTo`}
                type="date"
                name="dateTo"
                defaultValue={state.dateTo}
                className="po-jobs-filter__input po-jobs-filter__input--date"
              />
            </div>
          </div>
        ) : null}
      </fieldset>

      <div className="po-jobs-filter__footer">
        <p className="po-jobs-filter__hint">Filters apply as you select them.</p>
        <Link href="/jobs" className="po-jobs-filter__reset">
          Reset
        </Link>
      </div>
    </form>
  );
}
