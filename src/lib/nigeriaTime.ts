export function getNigeriaDateTimeString() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(now);
}
