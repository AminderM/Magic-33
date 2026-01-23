#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Driver Mobile App
Tests all driver mobile endpoints and TMS integration
"""

import requests
import sys
import json
from datetime import datetime
import time
import base64
import io

class DriverMobileAPITester:
    def __init__(self, base_url="https://quick-view-28.preview.emergentagent.com"):
        self.base_url = base_url
        self.driver_token = None
        self.admin_token = None
        self.driver_user = None
        self.admin_user = None
        self.test_load_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            self.failed_tests.append({"name": name, "details": details})
            print(f"❌ {name} - {details}")

    def api_request(self, method, endpoint, token=None, data=None, files=None):
        """Make API request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if data and not files:
            headers['Content-Type'] = 'application/json'
            data = json.dumps(data)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, data=data, files=files)
                else:
                    response = requests.post(url, headers=headers, data=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, data=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_driver_login(self):
        """Test driver mobile login"""
        print("\n🔐 Testing Driver Authentication...")
        
        # Test valid login
        response = self.api_request('POST', '/api/driver-mobile/login', data={
            "email": "driver@test.com",
            "password": "Driver123!"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'user' in data:
                self.driver_token = data['access_token']
                self.driver_user = data['user']
                self.log_test("Driver Login Success", True)
                print(f"   Driver ID: {self.driver_user['id']}")
                print(f"   Driver Name: {self.driver_user['full_name']}")
            else:
                self.log_test("Driver Login Success", False, "Missing token or user data")
        else:
            self.log_test("Driver Login Success", False, f"Status: {response.status_code if response else 'No response'}")

        # Test invalid login
        response = self.api_request('POST', '/api/driver-mobile/login', data={
            "email": "driver@test.com",
            "password": "wrongpassword"
        })
        
        success = response and response.status_code == 401
        self.log_test("Driver Login Invalid Credentials", success, 
                     f"Expected 401, got {response.status_code if response else 'No response'}")

    def test_admin_login(self):
        """Test admin login for TMS endpoints"""
        print("\n👤 Testing Admin Authentication...")
        
        response = self.api_request('POST', '/api/auth/login', data={
            "email": "aminderpro@gmail.com",
            "password": "Admin123!"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data:
                self.admin_token = data['access_token']
                self.admin_user = data['user']
                self.log_test("Admin Login Success", True)
            else:
                self.log_test("Admin Login Success", False, "Missing token")
        else:
            self.log_test("Admin Login Success", False, f"Status: {response.status_code if response else 'No response'}")

    def test_driver_profile(self):
        """Test driver profile endpoints"""
        print("\n👤 Testing Driver Profile...")
        
        if not self.driver_token:
            self.log_test("Driver Profile - Get Info", False, "No driver token")
            return

        # Get driver info
        response = self.api_request('GET', '/api/driver-mobile/me', token=self.driver_token)
        success = response and response.status_code == 200
        self.log_test("Driver Profile - Get Info", success, 
                     f"Status: {response.status_code if response else 'No response'}")

        # Update profile
        response = self.api_request('PUT', '/api/driver-mobile/profile', 
                                  token=self.driver_token,
                                  data={"phone": "555-0123"})
        success = response and response.status_code == 200
        self.log_test("Driver Profile - Update", success,
                     f"Status: {response.status_code if response else 'No response'}")

    def test_loads_management(self):
        """Test loads endpoints"""
        print("\n📦 Testing Loads Management...")
        
        if not self.driver_token:
            self.log_test("Loads - Get Assigned", False, "No driver token")
            return

        # Get assigned loads
        response = self.api_request('GET', '/api/driver-mobile/loads', token=self.driver_token)
        if response and response.status_code == 200:
            loads = response.json()
            self.log_test("Loads - Get Assigned", True)
            print(f"   Found {len(loads)} loads")
            
            if loads:
                self.test_load_id = loads[0]['id']
                print(f"   Using load ID: {self.test_load_id}")
                
                # Test get specific load
                response = self.api_request('GET', f'/api/driver-mobile/loads/{self.test_load_id}', 
                                          token=self.driver_token)
                success = response and response.status_code == 200
                self.log_test("Loads - Get Specific Load", success,
                             f"Status: {response.status_code if response else 'No response'}")
            else:
                print("   No loads found for testing")
        else:
            self.log_test("Loads - Get Assigned", False, 
                         f"Status: {response.status_code if response else 'No response'}")

    def test_status_workflow(self):
        """Test status update workflow"""
        print("\n🔄 Testing Status Workflow...")
        
        if not self.driver_token or not self.test_load_id:
            self.log_test("Status - Update Workflow", False, "No driver token or load ID")
            return

        # Test status update
        response = self.api_request('POST', f'/api/driver-mobile/loads/{self.test_load_id}/status',
                                  token=self.driver_token,
                                  data={
                                      "status": "en_route_pickup",
                                      "note": "Starting route to pickup location",
                                      "latitude": 40.7128,
                                      "longitude": -74.0060
                                  })
        success = response and response.status_code == 200
        self.log_test("Status - Update to En Route Pickup", success,
                     f"Status: {response.status_code if response else 'No response'}")

        # Test invalid status transition
        response = self.api_request('POST', f'/api/driver-mobile/loads/{self.test_load_id}/status',
                                  token=self.driver_token,
                                  data={
                                      "status": "delivered",  # Invalid jump
                                      "note": "Invalid transition test"
                                  })
        success = response and response.status_code == 400
        self.log_test("Status - Invalid Transition Blocked", success,
                     f"Expected 400, got {response.status_code if response else 'No response'}")

        # Test problem status
        response = self.api_request('POST', f'/api/driver-mobile/loads/{self.test_load_id}/status',
                                  token=self.driver_token,
                                  data={
                                      "status": "problem",
                                      "note": "Test problem report"
                                  })
        success = response and response.status_code == 200
        self.log_test("Status - Report Problem", success,
                     f"Status: {response.status_code if response else 'No response'}")

        # Get status history
        response = self.api_request('GET', f'/api/driver-mobile/loads/{self.test_load_id}/status-history',
                                  token=self.driver_token)
        success = response and response.status_code == 200
        self.log_test("Status - Get History", success,
                     f"Status: {response.status_code if response else 'No response'}")

    def test_messaging(self):
        """Test messaging functionality"""
        print("\n💬 Testing Messaging...")
        
        if not self.driver_token or not self.test_load_id:
            self.log_test("Messaging - Send Message", False, "No driver token or load ID")
            return

        # Send message
        response = self.api_request('POST', f'/api/driver-mobile/loads/{self.test_load_id}/messages',
                                  token=self.driver_token,
                                  data={
                                      "content": "Test message from driver mobile app"
                                  })
        success = response and response.status_code == 200
        self.log_test("Messaging - Send Message", success,
                     f"Status: {response.status_code if response else 'No response'}")

        # Get messages
        response = self.api_request('GET', f'/api/driver-mobile/loads/{self.test_load_id}/messages',
                                  token=self.driver_token)
        success = response and response.status_code == 200
        if success:
            messages = response.json()
            print(f"   Found {len(messages)} messages")
        self.log_test("Messaging - Get Messages", success,
                     f"Status: {response.status_code if response else 'No response'}")

        # Get unread count
        response = self.api_request('GET', '/api/driver-mobile/messages/unread-count',
                                  token=self.driver_token)
        success = response and response.status_code == 200
        self.log_test("Messaging - Get Unread Count", success,
                     f"Status: {response.status_code if response else 'No response'}")

    def test_location_tracking(self):
        """Test location tracking"""
        print("\n📍 Testing Location Tracking...")
        
        if not self.driver_token:
            self.log_test("Location - Ping", False, "No driver token")
            return

        # Send location ping
        response = self.api_request('POST', '/api/driver-mobile/location/ping',
                                  token=self.driver_token,
                                  data={
                                      "lat": 40.7128,
                                      "lng": -74.0060,
                                      "accuracy_m": 10,
                                      "speed_mps": 0,
                                      "heading_deg": 0,
                                      "load_id": self.test_load_id
                                  })
        success = response and response.status_code == 200
        self.log_test("Location - Send Ping", success,
                     f"Status: {response.status_code if response else 'No response'}")

        # Get latest location
        response = self.api_request('GET', '/api/driver-mobile/location/latest',
                                  token=self.driver_token)
        success = response and response.status_code == 200
        self.log_test("Location - Get Latest", success,
                     f"Status: {response.status_code if response else 'No response'}")

    def test_documents(self):
        """Test document management"""
        print("\n📄 Testing Document Management...")
        
        if not self.driver_token or not self.test_load_id:
            self.log_test("Documents - Upload", False, "No driver token or load ID")
            return

        # Get documents list
        response = self.api_request('GET', f'/api/driver-mobile/loads/{self.test_load_id}/documents',
                                  token=self.driver_token)
        success = response and response.status_code == 200
        if success:
            docs = response.json()
            print(f"   Found {len(docs)} documents")
        self.log_test("Documents - Get List", success,
                     f"Status: {response.status_code if response else 'No response'}")

        # Test document upload (simulate a small text file)
        try:
            # Create a small test file
            test_content = b"Test document content for BOL"
            files = {'file': ('test_bol.txt', io.BytesIO(test_content), 'text/plain')}
            data = {'doc_type': 'bol'}
            
            response = self.api_request('POST', f'/api/driver-mobile/loads/{self.test_load_id}/documents',
                                      token=self.driver_token,
                                      data=data,
                                      files=files)
            success = response and response.status_code == 200
            self.log_test("Documents - Upload File", success,
                         f"Status: {response.status_code if response else 'No response'}")
        except Exception as e:
            self.log_test("Documents - Upload File", False, f"Error: {str(e)}")

    def test_tms_integration(self):
        """Test TMS integration endpoints"""
        print("\n🔗 Testing TMS Integration...")
        
        if not self.admin_token or not self.driver_user:
            self.log_test("TMS - Driver Location", False, "No admin token or driver info")
            return

        driver_id = self.driver_user['id']

        # Get driver's latest location (TMS endpoint)
        response = self.api_request('GET', f'/api/drivers/{driver_id}/location/latest',
                                  token=self.admin_token)
        success = response and response.status_code == 200
        self.log_test("TMS - Get Driver Location", success,
                     f"Status: {response.status_code if response else 'No response'}")

        if self.test_load_id:
            # Get load messages (TMS endpoint)
            response = self.api_request('GET', f'/api/drivers/loads/{self.test_load_id}/messages',
                                      token=self.admin_token)
            success = response and response.status_code == 200
            self.log_test("TMS - Get Load Messages", success,
                         f"Status: {response.status_code if response else 'No response'}")

            # Send message to driver (TMS endpoint)
            response = self.api_request('POST', f'/api/drivers/loads/{self.test_load_id}/messages',
                                      token=self.admin_token,
                                      data={
                                          "content": "Test message from dispatch via TMS"
                                      })
            success = response and response.status_code == 200
            self.log_test("TMS - Send Message to Driver", success,
                         f"Status: {response.status_code if response else 'No response'}")

    def test_error_handling(self):
        """Test error handling and edge cases"""
        print("\n⚠️  Testing Error Handling...")

        # Test unauthorized access
        response = self.api_request('GET', '/api/driver-mobile/loads')
        success = response and response.status_code == 401
        self.log_test("Error - Unauthorized Access", success,
                     f"Expected 401, got {response.status_code if response else 'No response'}")

        # Test invalid load ID
        if self.driver_token:
            response = self.api_request('GET', '/api/driver-mobile/loads/invalid-id',
                                      token=self.driver_token)
            success = response and response.status_code == 404
            self.log_test("Error - Invalid Load ID", success,
                         f"Expected 404, got {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚛 Starting Driver Mobile App Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)

        # Authentication tests
        self.test_driver_login()
        self.test_admin_login()

        # Core functionality tests
        self.test_driver_profile()
        self.test_loads_management()
        self.test_status_workflow()
        self.test_messaging()
        self.test_location_tracking()
        self.test_documents()

        # Integration tests
        self.test_tms_integration()

        # Error handling tests
        self.test_error_handling()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                print(f"   • {test['name']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    """Main test execution"""
    tester = DriverMobileAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())