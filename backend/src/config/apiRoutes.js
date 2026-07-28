export const apiRoutes = {
  health: "/",
  requesters: {
    base: "/api/requesters",
    phoneLogin: "/phone-login",
    me: "/me",
    profile: "/me/profile",
  },
  bloodRequests: {
    base: "/api/blood-requests",
    create: "/",
    list: "/",
    detail: "/:id",
    cancel: "/:id/cancel",
  },
};
