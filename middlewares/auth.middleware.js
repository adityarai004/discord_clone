import jwt from "jsonwebtoken";

const verifyUser = async (req, res, next) => {
  try {
    // Check if the Authorization header exists and starts with "Bearer "
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")
    ) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user information (from the token payload) to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle token verification errors
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export { verifyUser };
