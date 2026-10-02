import fs from "node:fs";
import jwt from "jsonwebtoken";

const keyId = process.env.ASC_KEY_ID?.trim();
const issuerId = process.env.ASC_ISSUER_ID?.trim();
const pemPath = process.env.ASC_KEY_PATH;
const presetTeam = process.env.APPLE_TEAM_ID?.trim();
const bundleId = "com.willette.hearth";

if (!keyId || !issuerId || !pemPath) {
  throw new Error("ASC_KEY_ID, ASC_ISSUER_ID, and ASC_KEY_PATH are required.");
}
if (!/^[0-9a-f-]{36}$/i.test(issuerId)) {
  throw new Error(
    "ASC_ISSUER_ID should be the UUID labeled Issuer ID at the top of App Store Connect → Integrations, not the Key ID.",
  );
}
if (keyId.length < 8 || keyId.length > 16 || /\s/.test(keyId)) {
  throw new Error("ASC_KEY_ID should be the short Key ID from the keys table.");
}

const pem = fs.readFileSync(pemPath, "utf8");

function token() {
  return jwt.sign({ iss: issuerId, aud: "appstoreconnect-v1" }, pem, {
    algorithm: "ES256",
    expiresIn: "12m",
    header: { alg: "ES256", kid: keyId, typ: "JWT" },
  });
}

function writeTeam(team) {
  const out = process.env.GITHUB_ENV;
  if (out) fs.appendFileSync(out, `APPLE_TEAM_ID=${team}\n`);
  console.log("team_ok");
}

if (presetTeam) {
  writeTeam(presetTeam);
  process.exit(0);
}

async function asc(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err = json?.errors?.[0];
    throw new Error(
      `ASC ${method} ${path} ${res.status}: ${err?.code ?? ""} ${err?.detail ?? text.slice(0, 240)}`,
    );
  }
  return json;
}

const existing = await asc(
  "GET",
  `/v1/bundleIds?filter[identifier]=${encodeURIComponent(bundleId)}&limit=1`,
);
let row = existing?.data?.[0];
if (!row) {
  const created = await asc("POST", "/v1/bundleIds", {
    data: {
      type: "bundleIds",
      attributes: {
        identifier: bundleId,
        name: "Hearth",
        platform: "IOS",
      },
    },
  });
  row = created.data;
}

const team = row?.attributes?.seedId;
if (!team) {
  throw new Error(
    "App Store Connect did not return a Team ID. Add GitHub secret APPLE_TEAM_ID from developer.apple.com/account.",
  );
}

const apps = await asc(
  "GET",
  `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&limit=1`,
);
if (!apps?.data?.length) {
  try {
    await asc("POST", "/v1/apps", {
      data: {
        type: "apps",
        attributes: {
          bundleId,
          name: "Hearth",
          primaryLocale: "en-US",
          sku: "hearth",
        },
      },
    });
    console.log("created_app hearth");
  } catch (err) {
    console.log("app_create_skipped", err instanceof Error ? err.message : err);
  }
}

writeTeam(team);
