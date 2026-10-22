import { queryOptions } from "@tanstack/react-query";

import { getPatients, getProfile } from "./api";

export const patientsQuery = queryOptions({
  queryKey: ["patients"],
  queryFn: () => getPatients(),
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: () => getProfile(),
});
