export type SessionMode = "saved" | "demo";

export function isDemoSessionRequested(search: string): boolean {
  return new URLSearchParams(search).get("demo") === "1";
}

function sessionPath(href: string, mode: SessionMode): string {
  const url = new URL(href);
  if (mode === "demo") {
    url.searchParams.set("demo", "1");
  } else {
    url.searchParams.delete("demo");
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function demoSessionPath(href: string): string {
  return sessionPath(href, "demo");
}

export function savedPracticePath(href: string): string {
  return sessionPath(href, "saved");
}
