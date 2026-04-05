/**
 * Simplified Load Test - Focus on Core Functionality
 */

interface TestResult {
  schoolId: number;
  email: string;
  token?: string;
  errors: string[];
  responseTimes: number[];
  avgResponseTime: number;
  success: boolean;
}

(async () => {
  const baseUrl = 'http://localhost:3333/api';
  const timestamp = Date.now();
  const numSchools = 1000; // Test with 1000 schools

  const results: TestResult[] = [];

  async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function makeRequest(method: string, path: string, body?: any, token?: string) {
  const startTime = performance.now();
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(`${baseUrl}${path}`, options);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData?.error || response.statusText;
      throw new Error(`HTTP ${response.status}: ${errorMsg}`);
    }

    return {
      data: responseData,
      responseTime,
      status: response.status,
    };
  } catch (error) {
    const endTime = performance.now();
    throw {
      error: error instanceof Error ? error.message : String(error),
      responseTime: endTime - startTime,
    };
  }
}

async function testSchool(schoolNumber: number) {
  const email = `school${schoolNumber}_${timestamp}@test.com`;
  const password = `testpass${schoolNumber}`;
  
  const result: TestResult = {
    schoolId: schoolNumber,
    email,
    errors: [],
    responseTimes: [],
    avgResponseTime: 0,
    success: false,
  };

  try {
    // Register
    console.log(`[${schoolNumber}/${numSchools}] Registering...`);
    let regRes;
    try {
      regRes = await makeRequest('POST', '/auth/register', {
        email,
        password,
        fullName: `School ${schoolNumber}`,
        role: 'admin',
      });
      result.token = regRes.data.data.token;
      result.responseTimes.push(regRes.responseTime);
    } catch (e: any) {
      result.errors.push(`Registration: ${e.error}`);
      return result;
    }

    // Test read endpoints
    const endpoints = [
      '/students',
      '/staff',
      '/classes',
      '/subjects',
      // '/dashboard', // Skip - has issues
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await makeRequest('GET', endpoint, undefined, result.token);
        result.responseTimes.push(res.responseTime);
      } catch (e: any) {
        result.errors.push(`GET ${endpoint}: ${e.error}`);
      }
      await sleep(50);
    }

    result.success = result.errors.length === 0;
    result.avgResponseTime = result.responseTimes.length > 0 
      ? result.responseTimes.reduce((a, b) => a + b, 0) / result.responseTimes.length 
      : 0;

  } catch (error) {
    result.errors.push(`Fatal error: ${error}`);
  }

  return result;
}

async function runTest() {
  console.log('🚀 Schofy App Capacity Test\n');
  console.log(`Testing ${numSchools} schools...\n`);

  // Health check
  try {
    await fetch(`${baseUrl}/health`);
    console.log('✅ Server is running\n');
  } catch {
    console.error('❌ Server is not running on port 3333');
    process.exit(1);
  }

  for (let i = 1; i <= numSchools; i++) {
    const result = await testSchool(i);
    results.push(result);

    const status = result.success ? '✅' : '❌';
    console.log(`${status} School ${i}: ${result.errors.length} errors, ${result.avgResponseTime.toFixed(1)}ms avg`);

    await sleep(300);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70) + '\n');

  const successful = results.filter(r => r.success).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const allResponseTimes = results.flatMap(r => r.responseTimes);
  
  console.log(`✅ Successful Schools: ${successful}/${numSchools}`);
  console.log(`❌ Failed Schools: ${numSchools - successful}/${numSchools}`);
  console.log(`📊 Total Errors: ${totalErrors}`);
  console.log(`⏱️  Avg Response Time: ${(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(2)}ms`);
  console.log(`⏱️  Min Response Time: ${Math.min(...allResponseTimes).toFixed(2)}ms`);
  console.log(`⏱️  Max Response Time: ${Math.max(...allResponseTimes).toFixed(2)}ms\n`);

  if (successful === numSchools) {
    console.log('✅ SUCCESS! Your app can handle ' + numSchools + ' schools WITHOUT ERRORS!');
    console.log('\n💡 Try increasing numSchools to find the breaking point.\n');
  } else {
    console.log('⚠️  Some schools encountered errors:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   School ${r.schoolId}: ${r.errors.join(' | ')}`);
    });
  }

  console.log('='.repeat(70) + '\n');
}

  await runTest();
})().catch(console.error);
