export type nameFields = {
  FirstName: string;
  LastName: string;
};

export type facultyCollection = {
  department: string;
  profiles: Array<nameFields>;
};

export type namesByDepartment = {
  [key: string]: string[];
};
