"use client";

import { useId, useState } from "react";
import { CircleCheck, Loader2 } from "lucide-react";

import { PARTNER_COMPANY_TYPES, PARTNER_FORM } from "@/app/content/partner";
import { submitPartnershipInquiry } from "@/src/lib/partnerSubmission";

export function PartnerForm() {
  const formErrorId = useId();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [city, setCity] = useState("");
  const [hiringNeeds, setHiringNeeds] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim()) {
      setFormError("Please fill in Company name, Your name, and Work email to continue.");
      return;
    }

    setFormError(null);
    setBusy(true);

    const result = await submitPartnershipInquiry({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      companyType: companyType.trim() || undefined,
      city: city.trim() || undefined,
      hiringNeeds: hiringNeeds.trim() || undefined,
    });

    setBusy(false);

    if (!result.ok) {
      setFormError(
        result.error ??
          "We could not submit your request right now. Please try again or email us directly.",
      );
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="form-inner po-partner-form__success" role="status" aria-live="polite">
        <CircleCheck aria-hidden className="po-partner-form__success-icon" size={40} />
        <h3>{PARTNER_FORM.successTitle}</h3>
        <p>{PARTNER_FORM.successBody}</p>
      </div>
    );
  }

  return (
    <form
      className="form-inner po-partner-form"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={formError ? formErrorId : undefined}
    >
      <fieldset className="po-partner-form__fieldset" disabled={busy}>
        <legend className="po-partner-form__legend">Your company details</legend>
        {formError ? (
          <p id={formErrorId} className="po-partner-form__error" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="row clearfix po-partner-form__grid">
          <div className="col-lg-6 col-md-12 col-sm-12">
            <div className="form-group">
              <label htmlFor="partner-co-name">
                Company name <span className="po-partner-form__required">(required)</span>
              </label>
              <input
                id="partner-co-name"
                type="text"
                name="companyName"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Sun Pharma Ltd"
                required
                aria-required="true"
                disabled={busy}
              />
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12">
            <div className="form-group">
              <label htmlFor="partner-contact-name">
                Your name <span className="po-partner-form__required">(required)</span>
              </label>
              <input
                id="partner-contact-name"
                type="text"
                name="contactName"
                autoComplete="name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
                required
                aria-required="true"
                disabled={busy}
              />
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12">
            <div className="form-group">
              <label htmlFor="partner-email">
                Work email <span className="po-partner-form__required">(required)</span>
              </label>
              <input
                id="partner-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hr@company.com"
                required
                aria-required="true"
                disabled={busy}
              />
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12">
            <div className="form-group">
              <label htmlFor="partner-phone">Phone number</label>
              <input
                id="partner-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98xxx xxxxx"
                disabled={busy}
              />
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12">
            <div className="form-group">
              <label htmlFor="partner-co-type">Company type</label>
              <select
                id="partner-co-type"
                name="companyType"
                className="po-partner-form__select"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                disabled={busy}
              >
                <option value="">Select type</option>
                {PARTNER_COMPANY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12">
            <div className="form-group">
              <label htmlFor="partner-city">Headquarters city</label>
              <input
                id="partner-city"
                type="text"
                name="city"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                disabled={busy}
              />
            </div>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12">
            <div className="form-group">
              <label htmlFor="partner-needs">Hiring needs (optional)</label>
              <textarea
                id="partner-needs"
                name="hiringNeeds"
                value={hiringNeeds}
                onChange={(e) => setHiringNeeds(e.target.value)}
                placeholder="Briefly describe the functions or roles you typically hire for (e.g. QA, Production, Regulatory...)"
                disabled={busy}
              />
            </div>
          </div>
          <div className="col-lg-12 col-md-12 col-sm-12">
            <div className="form-group po-partner-form__submit-wrap">
              <button type="submit" className="theme-btn btn-one" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 aria-hidden className="po-partner-form__spinner" size={18} />
                    <span>Sending…</span>
                  </>
                ) : (
                  PARTNER_FORM.submit
                )}
              </button>
            </div>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
