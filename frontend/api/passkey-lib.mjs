/**
 * Passkey (WebAuthn) helpers for YieldFlow testnet auth.
 * Credentials are sealed client-side with server HMAC (no DB required on Vercel).
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function fromB64url(s) {
  return Buffer.from(String(s), "base64url");
}

export function getPasskeyConfig(req, env = process.env) {
  const host = String(req?.headers?.host || "localhost").split(":")[0];
  const proto =
    (req?.headers?.["x-forwarded-proto"] && String(req.headers["x-forwarded-proto"]).split(",")[0]) ||
    (host.includes("localhost") || host === "127.0.0.1" ? "http" : "https");
  const originHeader = req?.headers?.origin;
  const origin =
    env.YIELDFLOW_RP_ORIGIN ||
    (typeof originHeader === "string" && originHeader) ||
    `${proto}://${req?.headers?.host || "localhost"}`;
  const rpID = env.YIELDFLOW_RP_ID || host || "localhost";
  const rpName = env.YIELDFLOW_RP_NAME || "YieldFlow";
  const sessionSecret =
    env.YIELDFLOW_SESSION_SECRET || env.YIELDFLOW_SIGNER_SECRET || "yieldflow-testnet-session-dev-only";
  return { origin, rpID, rpName, sessionSecret };
}

export function seal(value, secret) {
  const payload = b64url(Buffer.from(JSON.stringify(value), "utf8"));
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function unseal(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    throw Object.assign(new Error("Invalid sealed token"), { statusCode: 400 });
  }
  const [payload, sig] = token.split(".");
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw Object.assign(new Error("Invalid sealed token signature"), { statusCode: 401 });
  }
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export function issueChallengeToken({ type, employeeId, challenge, secret, ttlMs = 5 * 60 * 1000 }) {
  return seal(
    {
      type,
      employeeId,
      challenge,
      exp: Date.now() + ttlMs,
    },
    secret
  );
}

export function readChallengeToken(token, secret, expectedType) {
  const data = unseal(token, secret);
  if (expectedType && data.type !== expectedType) {
    throw Object.assign(new Error("Unexpected challenge type"), { statusCode: 400 });
  }
  if (!data.exp || Date.now() > Number(data.exp)) {
    throw Object.assign(new Error("Passkey challenge expired. Try again."), { statusCode: 401 });
  }
  return data;
}

export async function makeRegistrationOptions({ employeeId, rpID, rpName }) {
  const userID = new TextEncoder().encode(employeeId.slice(0, 64));
  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: employeeId,
    userDisplayName: "YieldFlow Employee",
    userID,
    timeout: 60_000,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
    supportedAlgorithmIDs: [-7, -257],
  });
}

export async function makeAuthenticationOptions({ rpID, credentialId }) {
  return generateAuthenticationOptions({
    rpID,
    timeout: 60_000,
    userVerification: "preferred",
    allowCredentials: credentialId
      ? [
          {
            id: credentialId,
          },
        ]
      : undefined,
  });
}

export async function verifyRegistration({ response, expectedChallenge, expectedOrigin, expectedRPID }) {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    requireUserVerification: false,
  });
}

export async function verifyAuthentication({
  response,
  expectedChallenge,
  expectedOrigin,
  expectedRPID,
  credential,
}) {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    credential: {
      id: credential.credentialID,
      publicKey: fromB64url(credential.credentialPublicKey),
      counter: Number(credential.counter || 0),
      transports: credential.transports,
    },
    requireUserVerification: false,
  });
}

export function packCredentialRecord({ employeeId, registrationInfo, response }) {
  const cred = registrationInfo.credential;
  return {
    employeeId,
    credentialID: cred.id,
    credentialPublicKey: b64url(cred.publicKey),
    counter: Number(cred.counter || 0),
    transports: response?.response?.transports || cred.transports || [],
    createdAt: new Date().toISOString(),
  };
}

export function bumpCounter(record, newCounter) {
  return { ...record, counter: Number(newCounter || record.counter || 0) };
}

export { randomBytes, b64url, fromB64url };
