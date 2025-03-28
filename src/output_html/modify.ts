import { Window } from "happy-dom";
import type { Document } from "happy-dom";

interface directoryDataMember {
  LastName: string;
  FirstName: string;
  FullName: string;
  URL: string;
  Email: string | null;
}

type directoryData = Record<string, directoryDataMember[]>;

interface profile {
  FirstName: string;
  LastName: string;
  URL: string;
  Email: string | null;
}

type profileData = Array<{
  department: string;
  profiles: Array<profile>;
}>;

// * Read in faculty-data-final.json
const file = Bun.file("directory_data/faculty-data-final.json");
const text = await file.text();
const directory_data: directoryData = JSON.parse(text);

// * Read in all profile data
const f2 = Bun.file("all_profiles/final_profiles.json");
const f2_text = await f2.text();
const all_profiles: profileData = JSON.parse(f2_text);

// * Array of expected faculty that are missing from faculty-data-final.json
const missing_faculty: string[] = [];

// * FUNCTIONS
function log_match(profile: profile, directory_match: directoryDataMember) {
  // * Drop-in console log for name matches
  console.log(
    `directory_match found: ${profile.FirstName} ${profile.LastName} | ${directory_match.FirstName} ${directory_match.LastName}: ${directory_match.URL}`
  );
}

async function replace_links(
  document: Document,
  profile: profile,
  data_match: directoryDataMember
) {
  // * Mutate the DOM with the new links
  const all_profileURL_instances = Array.from(
    document.querySelectorAll(`a[href='${profile.URL}']`)
  );
  const email_anchor = document.querySelector(
    `a[href='${profile.Email}']`
  ) as unknown as HTMLAnchorElement | null;

  // * Replace hrefs in all profile <a> with new links
  all_profileURL_instances.forEach((node) => {
    const anchor = node as unknown as HTMLAnchorElement;
    // console.log(`replacing ${profile.URL} with ${data_match.URL}`);
    anchor.href = data_match.URL;
  });

  // * Replace href in email <a>, if null then remove the button from the DOM
  if (data_match.Email !== null && email_anchor !== null) {
    email_anchor.href = `mailto:${data_match.Email}`;
  } else {
    const email_button_container = document.querySelector(
      `div.faculty-icon--container:has(a[href='${profile.Email}'])`
    );
    // console.log(`replacing ${profile.Email} with ${data_match.Email}`);
    email_button_container?.remove();
  }
}

function directory_isMissing(data: directoryData, firstName: string, lastName: string): boolean {
  if (data[lastName] === undefined) {
    return true;
  }

  if (data[lastName] !== undefined) {
    for (const person of data[lastName]) {
      const directory_firstName_fragment: string = person.FirstName.split(" ")[0];
      const profile_firstName_fragment: string = firstName.split(" ")[0];
      if (directory_firstName_fragment === profile_firstName_fragment) {
        return false;
      }
    }
  }
  return true;
}

async function process_html() {
  // * Iterate through all_profiles by department, and process the html file for each
  for (const item of all_profiles) {
    const department = item.department;
    const file = Bun.file(`html/input/${department}.html`);
    const html = await file.text();
    console.log(`Processing ${department}...`);

    const window = new Window();
    const document = window.document;
    document.body.innerHTML = html;

    // * inner loop
    for (const profile of item.profiles) {
      // * catches faculty that are in all_profiles (scraped from HTML), but are missing from the directory data export
      if (directory_isMissing(directory_data, profile.FirstName, profile.LastName)) {
        missing_faculty.push(`${profile.FirstName} ${profile.LastName}`);
        continue;
      }
      const matches_by_lastName: Array<directoryDataMember> = directory_data[`${profile.LastName}`];
      for (const directory_match of matches_by_lastName) {
        if (directory_match.FirstName === profile.FirstName) {
          // * exact match found, continue processing
          // log_match(profile, directory_match);
          await replace_links(document, profile, directory_match);
        } else if (directory_match.FirstName.includes(" ")) {
          const directory_firstName_fragment: string = directory_match.FirstName.split(" ")[0];
          const profile_firstName_fragment: string = profile.FirstName.split(" ")[0];
          if (directory_firstName_fragment === profile_firstName_fragment) {
            // * first name match found, continue processing
            // log_match(profile, directory_match);
            await replace_links(document, profile, directory_match);
          } else {
            // * jump to the next directory_match in the loop
            continue;
          }
        }
      }
    }
    // * Save modified HTML to html/output directory
    Bun.write(`html/output/${department}.html`, document.body.innerHTML);
    console.log(`Completed ${department}`);
    await window.happyDOM.close();
  }
  Bun.write(`missing_data/missing-faculty.json`, JSON.stringify(missing_faculty));
  console.clear();
  console.log("Finished processing. Check html/output for new files.");
}

process_html();
