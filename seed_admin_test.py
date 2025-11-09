#!/usr/bin/env python3
"""
Specific test for Seed Platform Admin endpoint and login functionality
Tests the exact scenario requested in the review
"""

import requests
import json
import sys
from datetime import datetime

class SeedAdminTester:
    def __init__(self, base_url="https://transport-central-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.results = []

    def log_result(self, step, success, message, response_data=None):
        """Log test result"""
        result = {
            'step': step,
            'success': success,
            'message': message,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {step}: {message}")
        
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)}")

    def test_seed_platform_admin(self):
        """Step 1: POST /api/admin/seed-platform-admin"""
        print("\n" + "="*60)
        print("🔧 STEP 1: SEED PLATFORM ADMIN")
        print("="*60)
        
        url = f"{self.base_url}/api/admin/seed-platform-admin"
        
        try:
            response = requests.post(url, timeout=30)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    expected_email = "aminderpro@gmail.com"
                    
                    # Check if response has expected structure
                    if 'status' in data and 'email' in data:
                        if data['email'] == expected_email and data['status'] in ['created', 'updated']:
                            self.log_result(
                                "Seed Platform Admin", 
                                True, 
                                f"Admin user {data['status']} successfully", 
                                data
                            )
                            return True
                        else:
                            self.log_result(
                                "Seed Platform Admin", 
                                False, 
                                f"Unexpected response data: {data}", 
                                data
                            )
                            return False
                    else:
                        self.log_result(
                            "Seed Platform Admin", 
                            False, 
                            f"Response missing required fields: {data}", 
                            data
                        )
                        return False
                        
                except json.JSONDecodeError:
                    self.log_result(
                        "Seed Platform Admin", 
                        False, 
                        f"Invalid JSON response: {response.text}"
                    )
                    return False
            else:
                self.log_result(
                    "Seed Platform Admin", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Seed Platform Admin", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_admin_login(self):
        """Step 2: POST /api/auth/login with admin credentials"""
        print("\n" + "="*60)
        print("🔐 STEP 2: ADMIN LOGIN")
        print("="*60)
        
        url = f"{self.base_url}/api/auth/login"
        
        login_data = {
            "email": "aminderpro@gmail.com",
            "password": "Admin@123!"
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, json=login_data, headers=headers, timeout=30)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Check for required fields
                    required_fields = ['access_token', 'user']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result(
                            "Admin Login", 
                            False, 
                            f"Response missing fields: {missing_fields}", 
                            data
                        )
                        return False
                    
                    # Store token for next test
                    self.token = data['access_token']
                    user_data = data['user']
                    
                    # Verify user data
                    if user_data.get('email') == 'aminderpro@gmail.com' and user_data.get('role') == 'platform_admin':
                        self.log_result(
                            "Admin Login", 
                            True, 
                            "Login successful with correct user data", 
                            {
                                'token_received': True,
                                'token_length': len(self.token),
                                'user_email': user_data.get('email'),
                                'user_role': user_data.get('role'),
                                'token_type': data.get('token_type')
                            }
                        )
                        return True
                    else:
                        self.log_result(
                            "Admin Login", 
                            False, 
                            f"Incorrect user data: email={user_data.get('email')}, role={user_data.get('role')}", 
                            data
                        )
                        return False
                        
                except json.JSONDecodeError:
                    self.log_result(
                        "Admin Login", 
                        False, 
                        f"Invalid JSON response: {response.text}"
                    )
                    return False
            else:
                self.log_result(
                    "Admin Login", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Admin Login", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_token_validation(self):
        """Step 3: GET /api/companies/current with Bearer token"""
        print("\n" + "="*60)
        print("🔍 STEP 3: TOKEN VALIDATION")
        print("="*60)
        
        if not self.token:
            self.log_result(
                "Token Validation", 
                False, 
                "No token available from login step"
            )
            return False
        
        url = f"{self.base_url}/api/companies/current"
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            # We expect 404 or 401 since admin doesn't have a company yet
            # But the important thing is that the token is accepted (not 401 due to invalid token)
            if response.status_code == 404:
                try:
                    data = response.json()
                    if 'detail' in data and 'company' in data['detail'].lower():
                        self.log_result(
                            "Token Validation", 
                            True, 
                            "Token accepted, 404 as expected (no company found)", 
                            {'status_code': 404, 'detail': data['detail']}
                        )
                        return True
                    else:
                        self.log_result(
                            "Token Validation", 
                            False, 
                            f"Unexpected 404 response: {data}", 
                            data
                        )
                        return False
                except json.JSONDecodeError:
                    self.log_result(
                        "Token Validation", 
                        False, 
                        f"Invalid JSON in 404 response: {response.text}"
                    )
                    return False
                    
            elif response.status_code == 401:
                try:
                    data = response.json()
                    self.log_result(
                        "Token Validation", 
                        False, 
                        f"Token rejected (401): {data.get('detail', 'Unknown error')}", 
                        data
                    )
                    return False
                except json.JSONDecodeError:
                    self.log_result(
                        "Token Validation", 
                        False, 
                        f"Token rejected (401): {response.text}"
                    )
                    return False
                    
            elif response.status_code == 200:
                # Unexpected but good - admin somehow has a company
                try:
                    data = response.json()
                    self.log_result(
                        "Token Validation", 
                        True, 
                        "Token accepted, company data returned (unexpected but valid)", 
                        {'status_code': 200, 'has_company': True}
                    )
                    return True
                except json.JSONDecodeError:
                    self.log_result(
                        "Token Validation", 
                        False, 
                        f"Invalid JSON in 200 response: {response.text}"
                    )
                    return False
            else:
                self.log_result(
                    "Token Validation", 
                    False, 
                    f"Unexpected status code {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Token Validation", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def run_test_sequence(self):
        """Run the complete test sequence"""
        print("🚀 Starting Seed Platform Admin Test Sequence")
        print(f"🌐 Backend URL: {self.base_url}")
        print("="*80)
        
        # Test sequence as specified in the request
        tests = [
            ("Seed Platform Admin", self.test_seed_platform_admin),
            ("Admin Login", self.test_admin_login),
            ("Token Validation", self.test_token_validation)
        ]
        
        all_passed = True
        
        for test_name, test_func in tests:
            try:
                success = test_func()
                if not success:
                    all_passed = False
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
                self.log_result(test_name, False, f"Exception: {str(e)}")
                all_passed = False
        
        self.print_summary()
        return all_passed

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📊 SEED ADMIN TEST SUMMARY")
        print("="*80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests == 0:
            print("🎉 ALL TESTS PASSED - Seed admin functionality working correctly")
        else:
            print("⚠️  SOME TESTS FAILED - Issues found with seed admin functionality")
            
            print(f"\n❌ FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"   • {result['step']}: {result['message']}")
        
        print("\n📋 DETAILED RESULTS:")
        for i, result in enumerate(self.results, 1):
            status = "✅" if result['success'] else "❌"
            print(f"   {i}. {status} {result['step']}: {result['message']}")
        
        print("="*80)

def main():
    """Main test execution"""
    tester = SeedAdminTester()
    
    try:
        success = tester.run_test_sequence()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Test crashed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())