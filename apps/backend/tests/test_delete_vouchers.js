const url = 'http://localhost:3001';

async function runTests() {
  console.log('--- Testing Create & Delete Voucher APIs ---');
  
  // 1. Login
  const loginRes = await fetch(`${url}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  if (loginData.status !== 'success') {
    console.error('❌ Login failed:', loginData.message);
    return;
  }
  const token = loginData.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // 2. Create a dummy expense voucher
  const createExpRes = await fetch(`${url}/api/expenses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      shop_id: 1,
      account_id: 1, // প্রধান ক্যাশ
      voucher_date: new Date().toISOString().substring(0, 10),
      remarks: 'Test Delete Expense',
      details: [
        {
          category_id: 2, // দোকান ভাড়া
          amount: 10,
          description: 'Test delete row'
        }
      ]
    })
  });
  const expData = await createExpRes.json();
  if (expData.status === 'success') {
    const expId = expData.id || expData.data?.id || expData.voucher_id || expData.data?.voucher_id;
    console.log(`✅ Created test expense. ID: ${expId}`);
    
    // 3. Delete the dummy expense voucher
    const delExpRes = await fetch(`${url}/api/expenses/${expId}`, {
      method: 'DELETE',
      headers
    });
    const delExpData = await delExpRes.json();
    console.log('DELETE Expense API Response:', delExpData);
  } else {
    console.error('❌ Failed to create test expense:', expData);
  }

  // 4. Create a dummy income voucher
  const createIncRes = await fetch(`${url}/api/incomes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      shop_id: 1,
      account_id: 1,
      category_id: 1,
      amount: 15,
      description: 'Test Delete Income',
      income_date: new Date().toISOString().substring(0, 10),
      remarks: 'Test remarks'
    })
  });
  const incData = await createIncRes.json();
  if (incData.status === 'success') {
    const incId = incData.id || incData.data?.id || incData.income_id || incData.data?.income_id;
    console.log(`✅ Created test income. ID: ${incId}`);

    // 5. Delete the dummy income voucher
    const delIncRes = await fetch(`${url}/api/incomes/${incId}`, {
      method: 'DELETE',
      headers
    });
    const delIncData = await delIncRes.json();
    console.log('DELETE Income API Response:', delIncData);
  } else {
    console.error('❌ Failed to create test income:', incData);
  }
}

runTests();
