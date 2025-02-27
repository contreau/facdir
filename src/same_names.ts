import type { facultyCollection } from "./process_input/types";

type lastName = string;
interface content {
  profile: string;
  firstName: string;
}
interface register {
  [key: lastName]: Array<content>;
}

const file = await Bun.file("all_profiles/profiles.json").text();
const data: Array<facultyCollection> = JSON.parse(file);

// * create and populate the name register
const name_register: register = {};
for (const item of data) {
  for (const profile of item.profiles) {
    if (!name_register[profile.LastName]) {
      name_register[profile.LastName] = [
        {
          profile: profile.URL,
          firstName: profile.FirstName,
        },
      ];
    } else {
      name_register[profile.LastName].push({
        profile: profile.URL,
        firstName: profile.FirstName,
      });
    }
  }
}

// * compare urls, not departments - if the first + last names are the same and their profile urls are different, flag them.

type profile = string;
interface firstNameLookup {
  [key: string]: profile;
}

for (const lastName of Object.keys(name_register)) {
  const entry = name_register[lastName];
  if (entry.length > 1) {
    const lookup: firstNameLookup = {}; // create a new lookup obj for each last name
    for (const person of entry) {
      if (!lookup[person.firstName]) {
        // create the key if it doesn't exist
        lookup[person.firstName] = person.profile;
      } else if (lookup[person.firstName]) {
        // if it does exist, compare the profile urls of the name match with the current iteration
        const profile = lookup[person.firstName];
        if (profile !== person.profile) {
          console.log(`SAME NAME, DIFFERENT PROFILES FOUND:`);
          console.log(`${person.firstName} ${lastName}`);
          console.log(profile);
          console.log(person.profile);
        }
      }
    }
  }
}
