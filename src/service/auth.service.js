import * as userRepository from "../repository/user.repository.js";
import { comparePassword } from "../utils/passwordHelper.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.helper.js";
import { UnauthorizedError, NotFoundError } from "../core/error.response.js";
import { hashPassword } from "../utils/passwordHelper.js";
import { ConflictError } from "../core/error.response.js";

export const register = async ({ name, email, password, role }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ConflictError("Email is already registered");
  }

  const hashedPassword = await hashPassword(password);
  const newUser = await userRepository.create({
    name,
    email,
    passwordHash: hashedPassword,
    role: role || "MEMBER",
  });

  return newUser;
};

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
  const refreshToken = generateRefreshToken({ sub: user.id });
    // 4. Lưu refresh token vào DB để quản lý phiên
  await userRepository.updateRefreshToken(user.id, refreshToken);
  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken,
    refreshToken,
    user: userResponse,
  };
};

export const refreshTokenService = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new UnauthorizedError("Refresh token is invalid or has expired!");
  }

  const userId = decoded.sub || decoded.id;
  const user = await userRepository.findById(userId);

  // Kiểm tra tài khoản còn tồn tại và token gửi lên có trùng với token trong DB không
  const rawUser = await userRepository.findByEmail(user?.email);
  if (!rawUser || rawUser.refresh_token !== refreshToken) {
    throw new UnauthorizedError("Refresh token is invalid or has expired!");
  }

  const newAccessToken = generateAccessToken({
    sub: rawUser.id,
    role: rawUser.role,
  });

  return {
    accessToken: newAccessToken,
  };
};

export const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

export const logout = async (userId) => {
  await userRepository.updateRefreshToken(userId, null);
  return true;
};