export type nameFields = {
  FirstName: string;
  LastName: string;
  URL: string;
  Email: string | null;
};

export type facultyCollection = {
  department: string;
  profiles: Array<nameFields>;
};

export type namesByDepartment = {
  [key: string]: string[];
};

export interface profileURLs {
  profile_url: string;
  email_url: string | null;
}
