import { siteAsset } from "./paths";

const CORE_STYLES = [
  "css/font-awesome-all.css",
  "css/flaticon.css",
  "css/owl.css",
  "css/bootstrap.css",
  "css/jquery.fancybox.min.css",
  "css/animate.css",
  "css/nice-select.css",
  "css/odometer.css",
  "css/elpath.css",
  "css/color.css",
  "css/style.css",
  "css/responsive.css",
] as const;

const MODULE_STYLES = [
  "css/module-css/header.css",
  "css/module-css/banner.css",
  "css/module-css/clients.css",
  "css/module-css/about.css",
  "css/module-css/chooseus.css",
  "css/module-css/category.css",
  "css/module-css/industries.css",
  "css/module-css/process.css",
  "css/module-css/subscribe.css",
  "css/module-css/footer.css",
  "css/module-css/page-title.css",
  "css/module-css/news.css",
  "css/module-css/blog-sidebar.css",
  "css/module-css/blog-details.css",
  "css/module-css/job.css",
  "css/module-css/job-details.css",
  "css/module-css/login.css",
  "css/module-css/contact.css",
] as const;

type SiteStylesProps = {
  extraModules?: string[];
};

export function SiteStyles({ extraModules = [] }: SiteStylesProps) {
  const modules = [...MODULE_STYLES, ...extraModules];
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&display=swap"
        rel="stylesheet"
      />
      {CORE_STYLES.map((href) => (
        <link key={href} href={siteAsset(href)} rel="stylesheet" />
      ))}
      {modules.map((href) => (
        <link key={href} href={siteAsset(href)} rel="stylesheet" />
      ))}
      {/* Load after template CSS so PharmaOpenings overrides win (mobile nav colors, etc.) */}
      <link href={siteAsset("css/site-overrides.css")} rel="stylesheet" />
    </>
  );
}
