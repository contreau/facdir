import type { namesByDepartment } from "./types";
import type { HTMLAnchorElement } from "happy-dom/src/index.ts";

export async function checkDirectory(profile_url: string): Promise<boolean> {
  const res = await fetch(profile_url);
  const status = await res.text();
  if (status.includes("No Record Found")) {
    return false;
  }
  return true;
}

export function formatLongNames(
  names_data: namesByDepartment,
  department: string,
  split_name: string[],
  anchor: HTMLAnchorElement
) {
  names_data[`${department}`].push(anchor.textContent as string);
  const last_name_split = split_name.slice(1, split_name.length);
  const lastName = last_name_split.join(" ");
  return {
    firstName: split_name[0],
    lastName: lastName,
  };
}
