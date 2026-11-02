import * as userRepository from "../repository/user.repository.js";
import { comparePassword } from "../utils/passwordHelper.js";
import { generateAccessToken } from "../utils/jwt.helper.js";
import { UnauthorizedError, NotFoundError } from "../core/error.response.js";
export const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const payload = {
    sub: user.id,
    role: user.role,
  };
  const accessToken = generateAccessToken(payload);

  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken,
    user: userResponse,
  };
};

export const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};