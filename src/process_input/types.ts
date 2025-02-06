export type nameFields = {
  firstName: string;
  lastName: string;
};

export type facultyCollection = {
  department: string;
  profiles: Array<nameFields>;
};

export type namesByDepartment = {
  [key: string]: string[];
};
