import { app } from "./src/index";

async function runTests() {
  console.log("Starting API Integration Test Flow...\n");

  // ── User 1 (Owner) ──
  const testEmail1 = `owner_${Date.now()}@example.com`;
  let token1 = "";
  let userId1 = "";
  let householdId = "";

  // ── User 2 (Member) ──
  const testEmail2 = `member_${Date.now()}@example.com`;
  let token2 = "";

  // ── Invitation ──
  let inviteToken = "";

  // =========================================
  // AUTH TESTS
  // =========================================

  // 1. Test Register (User 1)
  console.log("1. Testing POST /api/auth/register (User 1)...");
  const regRes = await app.handle(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ridwan Owner",
        email: testEmail1,
        password: "password123",
        phone: "081234567890"
      })
    })
  );
  const regData = await regRes.json();
  console.log("Status:", regRes.status, JSON.stringify(regData, null, 2));
  if (!regData.meta.status || regRes.status !== 201) {
    throw new Error("Register failed!");
  }
  token1 = regData.data.token;
  userId1 = regData.data.user._id;

  // Verify members array exists in primary household
  const primaryHousehold = regData.data.primaryHousehold;
  if (
    !primaryHousehold?.members ||
    !Array.isArray(primaryHousehold.members) ||
    primaryHousehold.members[0]?.role !== "owner"
  ) {
    throw new Error("Primary household does not have correct members array!");
  }
  console.log("[OK] members array present in primary household");

  // 2. Test Duplicate Email
  console.log("\n2. Testing duplicate email POST /api/auth/register...");
  const dupRes = await app.handle(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Dupe", email: testEmail1, password: "password123" })
    })
  );
  const dupData = await dupRes.json();
  console.log("Status:", dupRes.status);
  if (dupRes.status !== 400 || dupData.meta.status !== false) {
    throw new Error("Duplicate register should have been rejected!");
  }

  // 3. Login (User 1)
  console.log("\n3. Testing POST /api/auth/login (User 1)...");
  const loginRes = await app.handle(
    new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail1, password: "password123" })
    })
  );
  const loginData = await loginRes.json();
  console.log("Status:", loginRes.status);
  if (!loginData.meta.status || !loginData.data.token) throw new Error("Login failed!");

  // 4. Wrong password
  console.log("\n4. Testing wrong password...");
  const wrongRes = await app.handle(
    new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail1, password: "wrong_password" })
    })
  );
  if (wrongRes.status !== 401) throw new Error("Wrong password should be rejected!");

  // 5. GET /api/auth/me without token
  console.log("\n5. Testing GET /api/auth/me without token...");
  const unauthRes = await app.handle(
    new Request("http://localhost:3000/api/auth/me", { method: "GET" })
  );
  if (unauthRes.status !== 401) throw new Error("Unauthenticated access was not blocked!");

  // 6. GET /api/auth/me with token
  console.log("\n6. Testing GET /api/auth/me with Bearer token...");
  const meRes = await app.handle(
    new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token1}` }
    })
  );
  const meData = await meRes.json();
  if (!meData.meta.status || meData.data.passwordHash) {
    throw new Error("Profile retrieval failed or leaked passwordHash!");
  }

  // 7. PUT /api/auth/me
  console.log("\n7. Testing PUT /api/auth/me...");
  const updateMeRes = await app.handle(
    new Request("http://localhost:3000/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: "Ridwan Updated" })
    })
  );
  const updateMeData = await updateMeRes.json();
  if (!updateMeData.meta.status || updateMeData.data.name !== "Ridwan Updated") {
    throw new Error("Update profile failed!");
  }

  // =========================================
  // HOUSEHOLD TESTS
  // =========================================

  // 8. POST /api/households
  console.log("\n8. Testing POST /api/households...");
  const houseRes = await app.handle(
    new Request("http://localhost:3000/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        name: "Family Vacation Fund",
        currency: "USD",
        timezone: "Asia/Jakarta",
        settings: { startOfMonth: 5 }
      })
    })
  );
  const houseData = await houseRes.json();
  console.log("Status:", houseRes.status, JSON.stringify(houseData, null, 2));
  if (!houseData.meta.status || houseRes.status !== 201) {
    throw new Error("Create household failed!");
  }
  householdId = houseData.data._id;

  // Verify members array (not ownerId)
  if (!Array.isArray(houseData.data.members) || houseData.data.members[0]?.role !== "owner") {
    throw new Error("Created household does not have correct members array!");
  }
  if (houseData.data.ownerId !== undefined) {
    throw new Error("ownerId field should NOT exist in household!");
  }
  console.log("[OK] members array correct, ownerId absent");

  // 9. GET /api/households
  console.log("\n9. Testing GET /api/households...");
  const getHouseRes = await app.handle(
    new Request("http://localhost:3000/api/households", {
      headers: { Authorization: `Bearer ${token1}` }
    })
  );
  const getHouseData = await getHouseRes.json();
  if (!getHouseData.meta.status || !Array.isArray(getHouseData.data)) {
    throw new Error("Get households failed!");
  }

  // 10. PUT /api/households/:id
  console.log(`\n10. Testing PUT /api/households/${householdId}...`);
  const putHouseRes = await app.handle(
    new Request(`http://localhost:3000/api/households/${householdId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: "Updated Vacation Fund" })
    })
  );
  const putHouseData = await putHouseRes.json();
  if (!putHouseData.meta.status || putHouseData.data.name !== "Updated Vacation Fund") {
    throw new Error("Update household failed!");
  }

  // =========================================
  // INVITATION TESTS
  // =========================================

  // 11. POST /api/invitations (create invitation as owner)
  console.log("\n11. Testing POST /api/invitations (create invitation)...");
  const createInvRes = await app.handle(
    new Request("http://localhost:3000/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ householdId, email: testEmail2 })
    })
  );
  const createInvData = await createInvRes.json();
  console.log("Status:", createInvRes.status, JSON.stringify(createInvData, null, 2));
  if (!createInvData.meta.status || createInvRes.status !== 201) {
    throw new Error("Create invitation failed!");
  }
  inviteToken = createInvData.data.token;
  if (!inviteToken || inviteToken.length < 10) {
    throw new Error("Invitation token was not returned or is too short!");
  }
  console.log("[OK] Invitation token received (plaintext)");

  // 12. GET /api/invitations/validate/:token (no auth)
  console.log("\n12. Testing GET /api/invitations/validate/:token (no auth)...");
  const validateRes = await app.handle(
    new Request(`http://localhost:3000/api/invitations/validate/${inviteToken}`)
  );
  const validateData = await validateRes.json();
  console.log("Status:", validateRes.status, JSON.stringify(validateData, null, 2));
  if (!validateData.meta.status || validateRes.status !== 200) {
    throw new Error("Validate invitation failed!");
  }
  if (!validateData.data.householdName) {
    throw new Error("Validate response missing householdName!");
  }
  console.log("[OK] Invitation validated. Household:", validateData.data.householdName);

  // 13. Register User 2
  console.log("\n13. Registering User 2 (future member)...");
  const reg2Res = await app.handle(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Istri Member",
        email: testEmail2,
        password: "password456"
      })
    })
  );
  const reg2Data = await reg2Res.json();
  console.log("Status:", reg2Res.status);
  if (!reg2Data.meta.status || reg2Res.status !== 201) {
    throw new Error("Register User 2 failed!");
  }
  token2 = reg2Data.data.token;

  // 14. POST /api/invitations/accept/:token (User 2 accepts)
  console.log("\n14. Testing POST /api/invitations/accept/:token (User 2 accepts)...");
  const acceptRes = await app.handle(
    new Request(`http://localhost:3000/api/invitations/accept/${inviteToken}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token2}` }
    })
  );
  const acceptData = await acceptRes.json();
  console.log("Status:", acceptRes.status, JSON.stringify(acceptData, null, 2));
  if (!acceptData.meta.status || acceptRes.status !== 200) {
    throw new Error("Accept invitation failed!");
  }

  // Verify User 2 is now in the members array with role "member"
  const updatedHousehold = acceptData.data;
  const isMember = updatedHousehold?.members?.some(
    (m: any) => m.role === "member"
  );
  if (!isMember) {
    throw new Error("User 2 was not added to household members!");
  }
  console.log("[OK] User 2 is now a member of the household");

  // 15. Verify same token cannot be used again
  console.log("\n15. Testing that accepted token cannot be used again...");
  const reuseRes = await app.handle(
    new Request(`http://localhost:3000/api/invitations/accept/${inviteToken}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token2}` }
    })
  );
  const reuseData = await reuseRes.json();
  if (reuseData.meta.status === true) {
    throw new Error("Accepted token should NOT be reusable!");
  }
  console.log("[OK] Token correctly rejected on reuse");

  // =========================================
  // CLEANUP TESTS
  // =========================================

  // 16. DELETE /api/households/:id (owner)
  console.log(`\n16. Testing DELETE /api/households/${householdId}...`);
  const delHouseRes = await app.handle(
    new Request(`http://localhost:3000/api/households/${householdId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token1}` }
    })
  );
  const delHouseData = await delHouseRes.json();
  if (!delHouseData.meta.status) throw new Error("Delete household failed!");

  // 17. POST /api/auth/logout
  console.log("\n17. Testing POST /api/auth/logout...");
  const logoutRes = await app.handle(
    new Request("http://localhost:3000/api/auth/logout", { method: "POST" })
  );
  const logoutData = await logoutRes.json();
  console.log("Status:", logoutRes.status);

  // 18. DELETE /api/auth/me (User 1)
  console.log("\n18. Testing DELETE /api/auth/me (User 1)...");
  const delMeRes = await app.handle(
    new Request("http://localhost:3000/api/auth/me", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token1}` }
    })
  );
  const delMeData = await delMeRes.json();
  if (!delMeData.meta.status) throw new Error("Delete user 1 profile failed!");

  // 19. DELETE /api/auth/me (User 2)
  console.log("\n19. Testing DELETE /api/auth/me (User 2)...");
  const delMe2Res = await app.handle(
    new Request("http://localhost:3000/api/auth/me", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token2}` }
    })
  );
  const delMe2Data = await delMe2Res.json();
  if (!delMe2Data.meta.status) throw new Error("Delete user 2 profile failed!");

  console.log("\n ALL 19 TEST CASES PASSED SUCCESSFULLY!\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("\n Test execution failed:", err);
  process.exit(1);
});
