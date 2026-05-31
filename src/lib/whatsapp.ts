const WHATSAPP_PHONE_E164 = "919515582525";

export const WHATSAPP_DISPLAY_NUMBER = "+91 95155 82525";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi! I visited PharmaOpenings and would like to get in touch.";

export function getWhatsAppChatUrl(message = WHATSAPP_DEFAULT_MESSAGE): string {
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${WHATSAPP_PHONE_E164}?${params.toString()}`;
}
