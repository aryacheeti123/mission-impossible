import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getEffectiveStatus(status: string, closesAt: string) {
  if (status === "open" && new Date(closesAt).getTime() <= Date.now()) {
    return "closed";
  }

  return status;
}

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
