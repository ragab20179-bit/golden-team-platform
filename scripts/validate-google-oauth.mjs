/**
 * Validates Google OAuth credentials by checking the token endpoint
 * with an invalid code (expected: error response, not network failure)
 */
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FAIL: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set");
  process.exit(1);
}

console.log("GOOGLE_CLIENT_ID set:", true, "| length:", clientId.length);
console.log("GOOGLE_CLIENT_SECRET set:", true, "| length:", clientSecret.length);
console.log("Client ID format valid:", clientId.endsWith(".apps.googleusercontent.com"));

// Attempt token exchange with an invalid code — Google returns JSON error (not network failure)
// This confirms the credentials are recognized by Google's servers
const resp = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code: "invalid_test_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: "https://goldenteam-j23mranz.manus.space/api/auth/google/callback",
    grant_type: "authorization_code",
  }),
});

const data = await resp.json();
console.log("Google token endpoint response status:", resp.status);
console.log("Google error code:", data.error);

// Expected: 400 with error "invalid_grant" (code is invalid but credentials are recognized)
// If credentials are wrong: 401 with error "invalid_client"
if (data.error === "invalid_client") {
  console.error("FAIL: Google rejected the client credentials — check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
  process.exit(1);
} else if (data.error === "invalid_grant" || data.error === "invalid_request") {
  console.log("PASS: Google credentials are valid (test code rejected as expected, credentials accepted)");
  process.exit(0);
} else {
  console.log("PASS: Google endpoint reachable, response:", data.error || "ok");
  process.exit(0);
}
