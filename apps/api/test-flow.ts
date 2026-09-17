import { Elysia } from 'elysia';
import { app } from './src/index';

async function runTests() {
  console.log('🚀 Starting API Integration Test Flow...\n');

  const testEmail = `test_${Date.now()}@example.com`;
  let token = '';
  let userId = '';
  let householdId = '';

  // 1. Test Register
  console.log('1. Testing POST /api/auth/register...');
  const regRes = await app.handle(
    new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe Tester',
        email: testEmail,
        password: 'password123',
        phone: '081234567890'
      })
    })
  );
  const regData = await regRes.json();
  console.log('Status:', regRes.status, JSON.stringify(regData, null, 2));

  if (!regData.meta.status || regRes.status !== 201) {
    throw new Error('Register failed!');
  }
  token = regData.data.token;
  userId = regData.data.user._id;

  // 2. Test Duplicate Email Register
  console.log('\n2. Testing duplicate email POST /api/auth/register...');
  const dupRes = await app.handle(
    new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Tester',
        email: testEmail,
        password: 'password123'
      })
    })
  );
  const dupData = await dupRes.json();
  console.log('Status:', dupRes.status, JSON.stringify(dupData, null, 2));
  if (dupRes.status !== 400 || dupData.meta.status !== false) {
    throw new Error('Duplicate register validation failed to reject duplicate!');
  }

  // 3. Test Login with correct password
  console.log('\n3. Testing POST /api/auth/login...');
  const loginRes = await app.handle(
    new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    })
  );
  const loginData = await loginRes.json();
  console.log('Status:', loginRes.status, JSON.stringify(loginData, null, 2));
  if (!loginData.meta.status || !loginData.data.token) {
    throw new Error('Login failed!');
  }

  // 4. Test Login with wrong password
  console.log('\n4. Testing wrong password POST /api/auth/login...');
  const wrongRes = await app.handle(
    new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'wrong_password'
      })
    })
  );
  const wrongData = await wrongRes.json();
  console.log('Status:', wrongRes.status, JSON.stringify(wrongData, null, 2));
  if (wrongRes.status !== 401 || wrongData.meta.status !== false) {
    throw new Error('Wrong password test failed to reject!');
  }

  // 5. Test Protected GET /api/auth/me without token
  console.log('\n5. Testing GET /api/auth/me without token...');
  const unauthRes = await app.handle(
    new Request('http://localhost:3000/api/auth/me', {
      method: 'GET'
    })
  );
  const unauthData = await unauthRes.json();
  console.log('Status:', unauthRes.status, JSON.stringify(unauthData, null, 2));
  if (unauthRes.status !== 401 || unauthData.meta.status !== false) {
    throw new Error('Unauthenticated access was not blocked!');
  }

  // 6. Test GET /api/auth/me with Bearer token
  console.log('\n6. Testing GET /api/auth/me with Bearer token...');
  const meRes = await app.handle(
    new Request('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
  );
  const meData = await meRes.json();
  console.log('Status:', meRes.status, JSON.stringify(meData, null, 2));
  if (!meData.meta.status || meData.data.email !== testEmail || meData.data.passwordHash) {
    throw new Error('Profile retrieval failed or leaked passwordHash!');
  }

  // 7. Test PUT /api/auth/me
  console.log('\n7. Testing PUT /api/auth/me...');
  const updateMeRes = await app.handle(
    new Request('http://localhost:3000/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'John Updated Doe'
      })
    })
  );
  const updateMeData = await updateMeRes.json();
  console.log('Status:', updateMeRes.status, JSON.stringify(updateMeData, null, 2));
  if (!updateMeData.meta.status || updateMeData.data.name !== 'John Updated Doe') {
    throw new Error('Update profile failed!');
  }

  // 8. Test POST /api/households
  console.log('\n8. Testing POST /api/households...');
  const houseRes = await app.handle(
    new Request('http://localhost:3000/api/households', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Family Vacation Fund',
        currency: 'USD',
        timezone: 'Asia/Jakarta',
        settings: {
          startOfMonth: 5
        }
      })
    })
  );
  const houseData = await houseRes.json();
  console.log('Status:', houseRes.status, JSON.stringify(houseData, null, 2));
  if (!houseData.meta.status || houseRes.status !== 201) {
    throw new Error('Create household failed!');
  }
  householdId = houseData.data._id;

  // 9. Test GET /api/households
  console.log('\n9. Testing GET /api/households...');
  const getHouseRes = await app.handle(
    new Request('http://localhost:3000/api/households', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
  );
  const getHouseData = await getHouseRes.json();
  console.log('Status:', getHouseRes.status, JSON.stringify(getHouseData, null, 2));
  if (!getHouseData.meta.status || !Array.isArray(getHouseData.data)) {
    throw new Error('Get households failed!');
  }

  // 10. Test PUT /api/households/:id
  console.log(`\n10. Testing PUT /api/households/${householdId}...`);
  const putHouseRes = await app.handle(
    new Request(`http://localhost:3000/api/households/${householdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Updated Vacation Fund'
      })
    })
  );
  const putHouseData = await putHouseRes.json();
  console.log('Status:', putHouseRes.status, JSON.stringify(putHouseData, null, 2));
  if (!putHouseData.meta.status || putHouseData.data.name !== 'Updated Vacation Fund') {
    throw new Error('Update household failed!');
  }

  // 11. Test DELETE /api/households/:id
  console.log(`\n11. Testing DELETE /api/households/${householdId}...`);
  const delHouseRes = await app.handle(
    new Request(`http://localhost:3000/api/households/${householdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
  );
  const delHouseData = await delHouseRes.json();
  console.log('Status:', delHouseRes.status, JSON.stringify(delHouseData, null, 2));
  if (!delHouseData.meta.status) {
    throw new Error('Delete household failed!');
  }

  // 12. Test POST /api/auth/logout
  console.log('\n12. Testing POST /api/auth/logout...');
  const logoutRes = await app.handle(
    new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST'
    })
  );
  const logoutData = await logoutRes.json();
  console.log('Status:', logoutRes.status, JSON.stringify(logoutData, null, 2));

  // 13. Test DELETE /api/auth/me
  console.log('\n13. Testing DELETE /api/auth/me...');
  const delMeRes = await app.handle(
    new Request('http://localhost:3000/api/auth/me', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
  );
  const delMeData = await delMeRes.json();
  console.log('Status:', delMeRes.status, JSON.stringify(delMeData, null, 2));
  if (!delMeData.meta.status) {
    throw new Error('Delete / deactivate user profile failed!');
  }

  console.log('\n🎉 ALL 13 TEST CASES PASSED SUCCESSFULLY! 🎉\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
