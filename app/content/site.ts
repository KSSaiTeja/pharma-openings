/** Site-wide copy for PharmaOpenings marketing pages. */

export const CONTACT_SECTION = {
  badge: "Contact",
  title: "Let's start a conversation",
  body: "Listings, partnerships, or account support—we respond with care.",
  email: "hello@pharmaopenings.com",
  phone: "+91 95155 82525",
  phoneTel: "+919515582525",
  intro:
    "Reach the Pharma Openings team for job listings, candidate support, partnerships, and employer enquiries across India and Europe.",
} as const;

export const CONTACT_MAPS = {
  india: "https://maps.google.com/maps?q=Baner,+Pune,+Maharashtra+411045&output=embed",
  europe: "https://maps.google.com/maps?q=Honigwiesenstr+1,+70563+Stuttgart,+Germany&output=embed",
} as const;

export const FOOTER_OFFICES = [
  {
    region: "India",
    lines: [
      "A2-402 Nandan Prospera",
      "Laxman nagar",
      "Baner -411045",
      "Pune",
    ],
  },
  {
    region: "Europe",
    lines: ["Honigwiesenstr 1", "70563 Stuttgart"],
  },
] as const;

export const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/pharmaopenings",
    icon: "fab fa-linkedin-in",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/pharmaopenings",
    icon: "fab fa-instagram",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/pharmaopenings",
    icon: "fab fa-facebook-f",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@pharmaopenings",
    icon: "fab fa-youtube",
  },
] as const;
