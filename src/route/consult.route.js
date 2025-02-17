import express from "express";

const router = express.Router();

// This RESTful endpoint is a dummy endpoint, which can be implemented and useful after setting up database and authentication
router.get("/result", (req, res) => {
  res.send(
    {result: "Result"}
  );
});

export default router;
