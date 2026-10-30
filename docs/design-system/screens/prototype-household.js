// Draws each state once (a <template>) and shows it in the light and dark theme, so the two frames
// can never drift apart. Prototype helper for #19 only.
for (const holder of document.querySelectorAll("[data-themes]")) {
  const template = holder.querySelector("template");
  for (const theme of ["light", "dark"]) {
    const frame = document.createElement("figure");
    frame.className = "frame";
    const screen = template.content.cloneNode(true);
    const device = screen.querySelector(".device");
    device.dataset.theme = theme;
    const size = device.classList.contains("device--desktop")
      ? "Desktop · 1440 × 900"
      : "Mobile · 360 × 800";
    frame.innerHTML = `<figcaption>${size} · ${theme === "light" ? "Light" : "Dark"}</figcaption>`;
    frame.append(screen);
    holder.append(frame);
  }
  template.remove();
}
