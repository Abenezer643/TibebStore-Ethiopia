import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserDoc } from "@/models/User";

const COOKIE_NAME = "tibeb_session";

export type SessionCookie = {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET env var");
  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signSession(user: {
  id: string;
  role: string;
  sellerStatus?: string;
  isSuspended?: boolean;
}) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sellerStatus: user.sellerStatus,
      isSuspended: user.isSuspended,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function makeSessionCookie(token: string): SessionCookie {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function makeClearSessionCookie(): SessionCookie {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function readSessionFromRequest(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE_NAME}=`));
  if (!part) return null;
  const token = decodeURIComponent(part.slice(COOKIE_NAME.length + 1));
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string; role: string };
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function readSession() {
  throw new Error(
    "readSession is not supported in route handlers. Use readSessionFromRequest(request)."
  );
}

export function toSafeUser(u: UserDoc) {
  return {
    id: String(u._id),
    email: u.email,
    username: u.username,
    role: u.role,
    sellerStatus: u.sellerStatus,
    isSuspended: u.isSuspended,
    avatar: (u as any).avatar,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}
