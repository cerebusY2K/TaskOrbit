import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskOrb",
    short_name: "TaskOrb",
    description: "Private boards for your work, people, and what each task is waiting on.",
    start_url: "/",
    display: "standalone",
    background_color: "#060a18",
    theme_color: "#060a18",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
