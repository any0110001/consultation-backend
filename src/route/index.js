import express from "express";
import consultRoute from "./consult.route.js";

// Create a router
const router = express.Router();

// Define your default routes
const defaultRoutes = [
  {
    path: "/consult",
    route: consultRoute,
  },
];

// Register default routes with the router
defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
