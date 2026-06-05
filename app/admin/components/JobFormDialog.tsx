"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  JOB_MODULE_SUGGESTIONS,
  JOB_QUALIFICATION_SUGGESTIONS,
} from "@/app/admin/lib/jobFields";
import { adminDialogClass } from "@/app/admin/components/AdminUi";
import { JOB_TYPES, type JobType } from "@/app/admin/admin-constants";

export type JobFormValues = {
  title: string;
  location: string;
  department: string;
  type: JobType;
  module: string;
  qualification_needed: string;
  description: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: JobFormValues;
  onChange: (patch: Partial<JobFormValues>) => void;
  onSave: () => void;
  saveBusy: boolean;
};

export function JobFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  onChange,
  onSave,
  saveBusy,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(adminDialogClass, "po-admin-job-dialog sm:max-w-2xl")}>
        <DialogHeader className="po-admin-dialog__header">
          <DialogTitle className="po-admin-dialog__title">{editing ? "Edit job" : "Add job"}</DialogTitle>
          <DialogDescription className="po-admin-dialog__description">
            Required fields are marked. For modules, use commas for multiple (e.g. OSD, API). Qualification accepts
            free text from your CSV template.
          </DialogDescription>
        </DialogHeader>

        <div className="po-admin-dialog__body po-admin-dialog__body--form po-admin-job-form">
          <div className="po-admin-job-form__row">
            <div className="po-admin-job-form__field">
              <Label htmlFor="job-title">Title *</Label>
              <Input
                id="job-title"
                className="po-admin-control"
                value={form.title}
                onChange={(e) => onChange({ title: e.target.value })}
              />
            </div>
            <div className="po-admin-job-form__field">
              <Label htmlFor="job-loc">Location *</Label>
              <Input
                id="job-loc"
                className="po-admin-control"
                value={form.location}
                onChange={(e) => onChange({ location: e.target.value })}
              />
            </div>
          </div>

          <div className="po-admin-job-form__row">
            <div className="po-admin-job-form__field">
              <Label htmlFor="job-dept">Department</Label>
              <Input
                id="job-dept"
                className="po-admin-control"
                value={form.department}
                onChange={(e) => onChange({ department: e.target.value })}
              />
            </div>
            <div className="po-admin-job-form__field">
              <Label htmlFor="job-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => onChange({ type: v as JobType })}>
                <SelectTrigger id="job-type" className="po-admin-control w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="po-admin-job-form__row">
            <div className="po-admin-job-form__field">
              <Label htmlFor="job-module">Module *</Label>
              <Input
                id="job-module"
                className="po-admin-control"
                list="job-module-suggestions"
                value={form.module}
                onChange={(e) => onChange({ module: e.target.value })}
                placeholder="e.g. OSD or OSD, API"
              />
              <datalist id="job-module-suggestions">
                {JOB_MODULE_SUGGESTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="po-admin-job-form__field">
              <Label htmlFor="job-qualification">Qualification needed *</Label>
              <Input
                id="job-qualification"
                className="po-admin-control"
                list="job-qualification-suggestions"
                value={form.qualification_needed}
                onChange={(e) => onChange({ qualification_needed: e.target.value })}
                placeholder="e.g. B. Pharma / M Pharma"
              />
              <datalist id="job-qualification-suggestions">
                {JOB_QUALIFICATION_SUGGESTIONS.map((q) => (
                  <option key={q} value={q} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="po-admin-job-form__field po-admin-job-form__field--full">
            <Label htmlFor="job-desc">Description *</Label>
            <Textarea
              id="job-desc"
              className="po-admin-control po-admin-job-form__textarea"
              rows={6}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="po-admin-dialog__footer">
          <Button type="button" variant="outline" className="po-admin-btn-outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="po-admin-btn-primary" onClick={onSave} disabled={saveBusy}>
            {saveBusy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
