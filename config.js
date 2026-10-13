window.SITE_CONFIG = {
  // Minecraft-Name, dessen aktueller Skin als 3D-Modell und Icon genutzt wird
  player: "INSIDEyourPC",
  // Header-Links: einfach weitere Eintraege ergaenzen
  links: [{
    label: "Maparts",
    href: "/Maparts"
  }
    // { label: "DonutSMP", href: "/DonutSMP" },
  ],
  // Skin-Quellen, werden der Reihe nach probiert ({name} = Spielername)
  skinSources: ["https://mc-heads.net/skin/{name}", "https://minotar.net/skin/{name}", "https://crafatar.com/skins/{name}"],
  // Icon-Fallback, falls der Skin nicht per Canvas gelesen werden kann
  iconFallback: "https://mc-heads.net/avatar/{name}/64"
};
