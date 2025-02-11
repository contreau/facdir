import { Window } from "happy-dom";
import type { Document } from "happy-dom";

interface exportedFacultyData {
  LastName: string;
  FirstName: string;
  FullName: string;
  URL: string;
  Email: string | null;
}

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

// * Read in fac-sample.json
const file = Bun.file("directory_data/fac-sample.json");
const text = await file.text();
const fac_data = JSON.parse(text);

// * Read in all profile data
const f2 = Bun.file("all_profiles/final_profiles.json");
const f2_text = await f2.text();
const all_profiles: profileData = JSON.parse(f2_text);

// * FUNCTIONS
function log_match(person: profile, match: exportedFacultyData) {
  // * Drop-in console log for name matches
  console.log(
    `match found: ${person.FirstName} ${person.LastName} | ${match.FirstName} ${match.LastName}: ${match.URL}`
  );
}

async function replace_links(
  document: Document,
  person: profile,
  data_match: exportedFacultyData
) {
  // * Mutate the DOM with the new links
  const all_profileURL_instances = Array.from(
    document.querySelectorAll(`a[href='${person.URL}']`)
  );
  const email_anchor = document.querySelector(
    `a[href='${person.Email}']`
  ) as unknown as HTMLAnchorElement | null;

  // * Replace hrefs in all profile <a> with new links
  all_profileURL_instances.forEach((node) => {
    const anchor = node as unknown as HTMLAnchorElement;
    // console.log(`replacing ${person.URL} with ${data_match.URL}`);
    anchor.href = data_match.URL;
  });

  // * Replace href in email <a>, if null then remove the button from the DOM
  if (data_match.Email !== null && email_anchor !== null) {
    email_anchor.href = `mailto:${data_match.Email}`;
  } else {
    const email_button_container = document.querySelector(
      `div.faculty-icon--container:has(a[href='${person.Email}'])`
    );
    // console.log(`replacing ${person.Email} with ${data_match.Email}`);
    email_button_container?.remove();
  }
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
    for (const person of item.profiles) {
      // ! This next line stays in until I have the full data
      if (fac_data[`${person.LastName}`] === undefined) {
        continue;
      }
      // ! (Resume)
      const lastName_matches: Array<exportedFacultyData> =
        fac_data[`${person.LastName}`];
      for (const match of lastName_matches) {
        let given_name: string | string[] = match.FirstName;
        if (given_name === person.FirstName) {
          // match found, continue processing
          // log_match(person, match);
          await replace_links(document, person, match);
        } else if (given_name.includes(" ")) {
          given_name = given_name.split(" ");
          if (given_name.includes(person.FirstName)) {
            // match found, continue processing
            // log_match(person, match);
            await replace_links(document, person, match);
          } else {
            // jump to the next match in the loop
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
  console.clear();
  console.log("Finished processing. Check html/output for new files.");
}

process_html();
