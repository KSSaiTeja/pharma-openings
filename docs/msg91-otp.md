# MSG91 SMS OTP (production)

Candidate **Send OTP** / **Verify** use Supabase Edge Functions `send-otp` and `verify-otp`. When MSG91 credentials are present on the function, OTP is generated and validated by MSG91 (not stored as plaintext in Postgres).

## New to SMS OTP and India DLT? Start here

This section is **concept-only** (not legal advice). Use MSG91’s wizards and your operator DLT portal as the source of truth.

### What “OTP SMS” means here

- A user enters their mobile number on your site.
- Your **server** asks MSG91 to **send one SMS** containing a short numeric code.
- The user types that code into your site; your **server** asks MSG91 to **check** if it matches what they sent.
- You never invent the SMS text at send time in code — the **text must match a pre-approved template** on India’s DLT system.

### What “DLT approved” means (India)

India’s telecom rules (TRAI) require businesses to register **who** is sending SMS and **exactly which message patterns** are allowed. That registry is often called **DLT** (Distributed Ledger Technology) in vendor docs.

In practice you usually complete:

1. **Principal entity (PE) / telemarketer** registration — MSG91 is often your SMS provider; you still register **your** company/brand as the entity sending messages. MSG91’s DLT help pages walk through this.
2. **Sender ID (Header)** — the short name users see as the SMS sender (e.g. `PHARMA` — rules vary; must be approved).
3. **Content template** — one fixed SMS **layout** with a placeholder where the **OTP digits** go. Example *shape* (your DLT portal will require an exact variable syntax, e.g. `{#var#}` — **use theirs, not this sentence verbatim**):

   > `{#var#} is your OTP for PharmaOpenings. Valid 5 mins. Do not share. - PHARMAOPENINGS`

4. **Approval** — an operator / DLT admin reviews the template. This often takes **a few business days** (sometimes longer).

5. **Map the approved template in MSG91** — after DLT approves the template, you link that DLT template to MSG91 so **SendOTP** can use it. MSG91 then shows you a **Template ID** you use in our API integration.

### “DLT ID” vs “Template ID” — what people mean

People say **“DLT ID”** for a few different things. In MSG91 forms it often means one of these:

| Name (typical) | What it is | Where you usually get it |
|----------------|------------|---------------------------|
| **Principal Entity (PE) ID** / **Entity ID** | Your **company’s** registration id on India’s DLT system (who is allowed to send). | The **DLT portal** where you registered your business (e.g. your operator’s DLT site, or the portal MSG91 tells you to use). It appears in your **entity / company profile** after registration is approved — not inside random MSG91 OTP screens. |
| **DLT content template ID** | The id **for one specific SMS text** after that text is approved on DLT. | Same DLT portal, under **templates** / **content** — after you submit the OTP message layout and it is **approved**. |
| **MSG91 Template ID** (SendOTP) | The id **MSG91** gives you after you **map** the approved DLT template into MSG91. | **SendOTP → Templates** in MSG91. This is what we put in `MSG91_OTP_TEMPLATE_ID`. |

So: **PE / entity “DLT ID”** comes from **DLT entity registration**, not from inventing a number in the Sender ID popup.

### Can I save country + Sender ID without a DLT / PE id?

- **If the field is optional** (no red asterisk, or “Skip / Add later”) — yes: enter **India** + **Header**, create, and continue. MSG91 may ask for PE / mapping on the **next** step or when you go live.
- **If “DLT ID” / “PE ID” is required** (red error, Create blocked) — you **cannot** skip it for that step. You must finish **entity (PE) registration** on the Indian DLT side first (MSG91’s **“Help Doc for Indian DLT entity/PE ID”** link in the modal is the right starting point). After approval, the portal shows your **PE ID**; you paste that into MSG91 where they ask for it.

You do **not** choose a PE id yourself — the DLT platform **issues** it after they verify your company.

### Which operator DLT portal should I use?

**You do not pick the portal from “which network my MSG91 / business phone is on.”** MSG91 is an **SMS provider (aggregator)**, not Airtel/Jio/Vi. The number you use to log into MSG91 does **not** decide which DLT website to use.

For **Principal Entity (PE) registration** and **templates**, you choose **one** official Indian DLT portal and complete entity + header + content template there. After approval, you map those ids back in MSG91.

MSG91’s own guidance is: you can register on **any** of the major operator DLT platforms; they explicitly recommend picking **one** from e.g. **Videocon, Airtel, Vi (VILPower), or Jio** (see [Entity registration on DLT platform](https://msg91.com/help/dlt-registration-in-india/entity-registration-on-dlt-platform)). They also document **SmartPing** as an option some teams use for quicker KYC flows.

**Practical approach:** open MSG91’s doc above, pick **one** portal (many teams use **Jio Trueconnect** or **Vi VILPower** or **Airtel** based on familiarity), register your **company** as PE, then add **Header** + **OTP content template** on that same portal. Use the **DLT template id** from that portal in MSG91’s **Create Template** form.

Templates/headers are tied to your **registered entity**, not to “the carrier of my phone number.”

Official MSG91 help (good next clicks):

- [Get approval for SMS content on DLT](https://msg91.com/help/get-approval-for-your-sms-content-on-dlt-platform)
- [DLT content template FAQs](https://msg91.com/help/dlt-registration-in-india/dlt-content-template-faqs)
- [Map approved DLT template on MSG91](https://msg91.com/help/dlt-registration-in-india/map-sms-content-template-on-msg91-api-panel) (includes **Send OTP V5** mapping)

### OTP length (important for this app)

Our UI expects a **4-digit** OTP. When you create the template / SendOTP flow in MSG91, choose **4 digits** if the panel offers length — otherwise users may receive 6 digits while the form only accepts 4.

### MSG91 “Create Template” popup — what each field means

| Field | What to enter |
|--------|----------------|
| **Template name** | Any **internal** label for you only (e.g. `PharmaOpenings login OTP`). Customers do not see this. |
| **Select Sender ID** | The **Header** you already set up (e.g. `PHAROPEN`). It should match what is **approved on DLT** for your entity. |
| **DLT Template ID** | The **content template id** from your **Indian DLT portal** — the id assigned **after** you submit the **exact SMS wording** (including the OTP placeholder) and that template is **approved**. It is **not** your company PE id and **not** the MSG91 Template ID you will use in code later. If you do not have this yet, you must **create + approve** the same message on the DLT site first, then copy the id they show (wording varies: “Template ID”, “Content Template ID”, etc.). |
| **OTP Content** | The **SMS body** that must **match** what you got approved on DLT (same words, same variable idea). Use **+ Add variable** so the changing OTP is a placeholder. MSG91’s hint (`##name##`, `##number##`, …) means: for SendOTP, use the variable name **MSG91 documents for OTP** (often `##otp##` — confirm in [MSG91 SendOTP / template docs](https://msg91.com/help/sendotp/where-to-find-the-sendotp-api-how-to-get-template-id)). The text you type here is what subscribers see, minus the live digits filled in by MSG91. |

**Order of work (so nothing is confusing):**

1. On the **DLT portal**, create and submit an **OTP SMS content template** (with their required variable format, often `{#var#}` on the government-style form — follow **that** portal’s rules).
2. Wait until that template is **approved** and the portal shows a **template / content id** — that value goes in **DLT Template ID** in MSG91.
3. In MSG91 **OTP Content**, paste the **same approved sentence**, using MSG91’s variable style (`##otp##` or whatever their doc says for SendOTP) so MSG91 can inject the code.
4. Click **Create** in MSG91. After that, MSG91 will show a **different** id — the **MSG91 SendOTP Template ID** — for use in `MSG91_OTP_TEMPLATE_ID` in Supabase.

If **DLT Template ID** is empty because you have not finished DLT content approval yet, you usually **cannot** complete a valid India production template in MSG91 until that id exists.

### What you’ll send the engineering side later (safely)

When you’re done in MSG91:

- **Template ID** from **SendOTP → Templates** (the id our env `MSG91_OTP_TEMPLATE_ID` expects).
- **Auth key** — set only in **Supabase Edge Function secrets**, never in public chat or in frontend env files.

You do **not** need to paste the full SMS template text into the codebase; MSG91 already tied the approved text to that template id.

## 1. MSG91 dashboard — use **SendOTP**, not the Widget

After you open **OTP** in the left menu, MSG91 shows two different products:

| Area in the sidebar | What it is | Do you need it? |
|---------------------|------------|------------------|
| **OTP Widget / SDK** (“Get Started”, Create Widget, Tokens, …) | Embeddable widget + client SDK for their UI | **No.** Our Next.js app does not use this. You can ignore “Create Widget” for PharmaOpenings. |
| **SendOTP** (subsection with **Templates**, Logs, Webhook, …) | Server API: send SMS OTP + verify by API | **Yes.** This matches what the Supabase Edge Functions call (`/api/v5/otp` and `/api/v5/otp/verify`). |

**What to do step by step**

1. In the left sidebar, under **SendOTP** (not Widget), open **Templates**.
2. Create an OTP SMS template (or use an existing one) and complete **India DLT** steps in MSG91 if the panel asks for them — otherwise SMS will not deliver.
3. Copy the **Template ID** for that OTP template (often a long alphanumeric id).
4. Copy your **Auth key** (authentication key for API). It is usually under **account / profile → API**, **Developer**, or **Integrations** (wording varies). It is *not* the Widget “auth token” from the Widget SDK screen.

Ensure the template is configured for a **4-digit** OTP so it matches the app (`OtpBoxes` length).

## 2. Supabase Edge Function secrets

In Supabase: **Project Settings → Edge Functions → Secrets** (or CLI `supabase secrets set`), add:

| Secret | Description |
|--------|-------------|
| `MSG91_AUTHKEY` | Your MSG91 authentication key. |
| `MSG91_OTP_TEMPLATE_ID` | OTP template ID from the dashboard. |

Do **not** put these in `NEXT_PUBLIC_*` variables; they must stay server-side.

Existing secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already available to Edge Functions.

## 3. Deploy the functions

From the repo root (with Supabase CLI linked to this project):

```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
```

## 4. Behaviour summary

- **Both** `MSG91_AUTHKEY` and `MSG91_OTP_TEMPLATE_ID` set → India mobile numbers (`91` + 10 digits, or 10-digit local starting with 6–9) receive SMS via MSG91 `POST https://control.msg91.com/api/v5/otp`. Verify uses `GET https://control.msg91.com/api/v5/otp/verify` with `authkey` in the **header** (per MSG91 docs).
- If those secrets are **missing** → previous behaviour: a random 4-digit code is stored in `otp_codes` (no SMS). For local/dev you can still use **`OTP_DEMO_BYPASS`** (default `true` when unset): entering **`1234`** verifies against the latest pending row. When MSG91 is configured, the **`1234` shortcut is disabled** automatically.
- To force-disable the demo code even without MSG91, set `OTP_DEMO_BYPASS=false` on the **verify-otp** function (then you must use Realtime OTP or another way to read the stored code during development).

## 5. Verify end-to-end

1. Register with a real Indian mobile.
2. You should receive an SMS from your DLT-approved sender.
3. Enter the code from the SMS (not `1234` when MSG91 is active).

If send fails, check the JSON error returned by MSG91 (template not mapped, DLT, insufficient balance, wrong `mobile` format). The API expects `919XXXXXXXXX` (no `+`); the Edge Function normalises common Indian inputs.
