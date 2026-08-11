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
  bloodBanks: {
    base: "/api/blood-banks",
    register: "/register",
    me: "/me",
    inventory: "/inventory",
    inventoryHistory: "/inventory/history",
  },
  bloodRequests: {
    base: "/api/blood-requests",
    bankBase: "/api/blood-requests/blood-bank",
    create: "/",
    list: "/",
    detail: "/:id",
    cancel: "/:id/cancel",
    matches: "/:id/matches",
    bankList: "/",
    bankDetail: "/:id",
    bankAccept: "/:id/accept",
    bankReject: "/:id/reject",
    bankComplete: "/:id/complete",
  },
};

