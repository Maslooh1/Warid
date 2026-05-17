export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const resp = await fetch(
      "https://api.github.com/repos/mohamedmaslooh/Warid/releases/latest",
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!resp.ok) return null;
    const data = await resp.json() as { tag_name?: string };
    return (data.tag_name ?? "").replace(/^v/, "") || null;
  } catch {
    return null;
  }
}

export function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [lMaj = 0, lMin = 0, lPatch = 0] = parse(latest);
  const [cMaj = 0, cMin = 0, cPatch = 0] = parse(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPatch > cPatch;
}
