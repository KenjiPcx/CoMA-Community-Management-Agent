const env = "dev";
const localEndpoint = "http://localhost:7071/api";
const prodEndpoint = "https://coma-backend.azurewebsites.net/api";
const endpoint = env === "dev" ? localEndpoint : prodEndpoint;

export const GET_UNREGISTERED_USERS_FROM_IDS = `${endpoint}/getUnregisteredUsersFromIds`;
