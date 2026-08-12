import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MilWeb | Sites e sistemas que dão resultado",
    short_name: "MilWeb",
    description:
      "Desenvolvedor Full Stack freelancer: sites, landing pages, sistemas web, catálogos para WhatsApp, dashboards e automações. Orçamento gratuito.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a10",
    theme_color: "#080a10",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  };
}
