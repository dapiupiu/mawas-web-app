export function scrollToSection(sectionId: string, behavior: ScrollBehavior = "smooth") {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior,
    block: "start",
  });
}
