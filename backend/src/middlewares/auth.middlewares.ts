import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized access");
  }

  const decoded = Jwt.verify(
    token,
    process.env.JWT_SECRET as Jwt.Secret
  ) as Jwt.JwtPayload;
  const user = await User.findById(decoded._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  if (!user) {
    throw new ApiError(401, "Invalid token, user not found");
  }

  req.user = user;
  next();
});
