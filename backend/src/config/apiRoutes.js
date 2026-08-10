export const apiRoutes = {
  health: "/",
  requesters: {
    base: "/api/requesters",
    phoneLogin: "/phone-login",
    me: "/me",
    profile: "/me/profile",
  },
  donors: {
    base: "/api/donors",
    register: "/register",
  },
  bloodRequests: {
    base: "/api/blood-requests",
    create: "/",
    list: "/",
    detail: "/:id",
    cancel: "/:id/cancel",
    matches: "/:id/matches",
  },
};

