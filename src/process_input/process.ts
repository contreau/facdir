import { readdir } from "node:fs/promises";
import { Window } from "happy-dom";
import { HTMLAnchorElement } from "happy-dom/src/index.ts";
import type {
  nameFields,
  facultyCollection,
  namesByDepartment,
  profileURLs,
} from "./types";
import { checkDirectory, formatLongNames } from "./helpers";

// ? ABOUT THIS SCRIPT
// This file iterates through and parses all html files in the html/input directory and generates the following JSON files:
// - A complete list of profiles by department (all_profiles)
// - Any multi-part or long names that need to be manually edited (long_names)
// - Missing profiles that can be deleted from the original HTML

// * Gather all html file names into one array
const html_fileNames: string[] = [];
const html_dir = await readdir("html/input");
for (let file of html_dir) {
  html_fileNames.push(file);
}

// * Data to be written to JSON
const all_profiles: Array<facultyCollection> = [];
const long_names: namesByDepartment = {};
const missing_profiles: namesByDepartment = {};

// * FUNCTIONS
async function process_inputHTML(directory: string[]) {
  // * BEGIN FILE PROCESSING
  console.clear();
  for (let filename of directory) {
    const facultyCollection: facultyCollection = {
      department: "",
      profiles: [],
    };
    const file = Bun.file(`html/input/${filename}`);
    console.log(`Processing ${filename}...`);
    const file_text = await file.text();
    const department = filename.split(".html")[0];

    // * Initialize arrays in long_names and missing_profiles directories
    if (!long_names[`${department}`]) {
      long_names[`${department}`] = [];
    }
    if (!missing_profiles[`${department}`]) {
      missing_profiles[`${department}`] = [];
    }
    facultyCollection.department = department;

    // * Create the 'DOM' for the given html file
    const window = new Window();
    const document = window.document;
    document.body.innerHTML = file_text;

    // * Loop through the <a> tags to process names
    const name_anchors = Array.from(
      document.querySelectorAll("p.mdbluetext a")
    );
    const names: nameFields[] = [];
    for (const a of name_anchors) {
      const anchor = a as unknown as HTMLAnchorElement;
      const inDirectory: boolean = await checkDirectory(anchor.href);
      if (!inDirectory) {
        missing_profiles[`${department}`].push(anchor.textContent);
        continue;
      }

      const urls: profileURLs = {
        profile_url: anchor.href,
        email_url: parse_emailURL(anchor),
      };
      let fields: nameFields;
      let has_titles: boolean = false;
      let stripped_name: string | null = null;
      let split_name: string[];

      // * Handle names with titles
      if (anchor.textContent.includes(",")) {
        has_titles = true;
        const titled_name = anchor.textContent.split(",");
        stripped_name = titled_name[0];
        split_name = stripped_name.split(" ");
      } else {
        split_name = anchor.textContent.split(" ");
      }

      // * Handle long names that had titles
      if (split_name.length > 2 && has_titles) {
        fields = formatLongNames(
          long_names,
          department,
          split_name,
          anchor,
          urls
        );
      }

      // * Handle long names without titles
      else if (split_name.length > 2 && !has_titles) {
        // * Remove any ending parenthesized substrings, then continue
        const last_substring = split_name.at(-1);
        if (last_substring !== undefined && last_substring[0] === "(") {
          split_name.pop();
          if (split_name.length > 2) {
            fields = formatLongNames(
              long_names,
              department,
              split_name,
              anchor,
              urls
            );
          } else {
            fields = {
              FirstName: split_name[0],
              LastName: split_name[1],
              URL: urls.profile_url,
              Email: urls.email_url,
            };
          }
        } else {
          fields = formatLongNames(
            long_names,
            department,
            split_name,
            anchor,
            urls
          );
        }
      }

      // * Default handling of names
      else {
        fields = {
          FirstName: split_name[0],
          LastName: split_name[1],
          URL: urls.profile_url,
          Email: urls.email_url,
        };
      }
      names.push(fields);
    }

    for (let name of names) {
      facultyCollection.profiles.push(name);
    }
    all_profiles.push(facultyCollection);
    await window.happyDOM.close();
  }
}

function write_json() {
  // * Write to the output JSON files
  Bun.write("all_profiles/profiles.json", JSON.stringify(all_profiles));
  Bun.write("long_names/longnames.json", JSON.stringify(long_names));
  Bun.write(
    "missing_profiles/missingprofiles.json",
    JSON.stringify(missing_profiles)
  );
  console.clear();
  console.log("Finished processing.");
}

function parse_emailURL(anchor: HTMLAnchorElement): string | null {
  // * Retrieve a person's email url or return null
  const container_div = anchor.parentElement?.parentElement;
  if (container_div !== null && container_div !== undefined) {
    const last_child =
      container_div.children[`${container_div?.children.length - 1}`];
    const new_anchor = last_child.children[0] as HTMLAnchorElement;
    if (new_anchor.localName === "a") {
      return new_anchor.getAttribute("aria-label") === "Send email"
        ? new_anchor.href
        : null;
    }
  }
  return null;
}

// * SCRIPT START
await process_inputHTML(html_fileNames);
write_json();
