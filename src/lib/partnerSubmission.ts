import { invokeSupabaseFunction } from "@/src/lib/edgeFunctions";

export type PartnerSubmissionPayload = {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  companyType?: string;
  city?: string;
  hiringNeeds?: string;
};

type SubmitPartnershipResponse = {
  success?: boolean;
  error?: string;
};

export async function submitPartnershipInquiry(
  payload: PartnerSubmissionPayload,
): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await invokeSupabaseFunction<SubmitPartnershipResponse>(
    "submit-partnership",
    payload,
  );

  if (error) {
    return { ok: false, error };
  }

  if (!data?.success) {
    return {
      ok: false,
      error: data?.error ?? "We could not submit your request. Please try again.",
    };
  }

  return { ok: true, error: null };
}
