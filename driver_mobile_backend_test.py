#!/usr/bin/env python3
"""
Driver Mobile App Backend API Testing
Tests all driver mobile endpoints including AI Assistant integration
"""

import requests
import sys
import json
from datetime import datetime
import uuid
import os
import time

class DriverMobileAPITester:
    def __init__(self, base_url="https://dispatch-pro-33.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.driver_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def api_call(self, method, endpoint, data=None, files=None):
        """Make API call with proper headers"""
        url = f"{self.base_url}/api/driver-mobile{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, data=data, files=files, timeout=30)
                else:
                    response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_driver_login(self):
        """Test driver login with provided credentials"""
        print("\n🔐 Testing Driver Authentication...")
        
        response = self.api_call('POST', '/login', {
            "email": "driver@test.com",
            "password": "Driver123!"
        })
        
        if not response:
            self.log_test("Driver Login", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'user' in data:
                self.token = data['access_token']
                self.driver_id = data['user']['id']
                self.log_test("Driver Login", True, f"Token received, Driver ID: {self.driver_id}")
                return True
            else:
                self.log_test("Driver Login", False, "Missing token or user data")
                return False
        else:
            self.log_test("Driver Login", False, f"Status {response.status_code}: {response.text}")
            return False

    def test_driver_info(self):
        """Test getting driver information"""
        print("\n👤 Testing Driver Info...")
        
        response = self.api_call('GET', '/me')
        
        if not response:
            self.log_test("Get Driver Info", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'id' in data and 'email' in data:
                self.log_test("Get Driver Info", True, f"Driver: {data.get('full_name', 'N/A')}")
                return True
            else:
                self.log_test("Get Driver Info", False, "Missing required fields")
                return False
        else:
            self.log_test("Get Driver Info", False, f"Status {response.status_code}")
            return False

    def test_loads_api(self):
        """Test loads endpoints"""
        print("\n🚛 Testing Loads API...")
        
        # Get driver loads
        response = self.api_call('GET', '/loads')
        
        if not response:
            self.log_test("Get Driver Loads", False, "Request failed")
            return None
        
        if response.status_code == 200:
            loads = response.json()
            self.log_test("Get Driver Loads", True, f"Found {len(loads)} loads")
            
            # Test load detail if loads exist
            if loads:
                load_id = loads[0].get('id')
                if load_id:
                    detail_response = self.api_call('GET', f'/loads/{load_id}')
                    if detail_response and detail_response.status_code == 200:
                        self.log_test("Get Load Detail", True, f"Load ID: {load_id}")
                        return load_id
                    else:
                        self.log_test("Get Load Detail", False, "Failed to get load detail")
                else:
                    self.log_test("Get Load Detail", False, "No load ID found")
            else:
                self.log_test("Get Load Detail", True, "No loads to test detail")
            
            return loads[0].get('id') if loads else None
        else:
            self.log_test("Get Driver Loads", False, f"Status {response.status_code}")
            return None

    def test_status_workflow(self, load_id):
        """Test load status update workflow"""
        if not load_id:
            self.log_test("Status Workflow", False, "No load ID available")
            return
        
        print("\n📊 Testing Status Workflow...")
        
        # Test status update
        status_data = {
            "status": "en_route_pickup",
            "note": "Heading to pickup location",
            "latitude": 41.8781,
            "longitude": -87.6298
        }
        
        response = self.api_call('POST', f'/loads/{load_id}/status', status_data)
        
        if not response:
            self.log_test("Update Load Status", False, "Request failed")
            return
        
        if response.status_code == 200:
            data = response.json()
            if 'message' in data and 'status' in data:
                self.log_test("Update Load Status", True, f"Status: {data['status']}")
                
                # Test status history
                history_response = self.api_call('GET', f'/loads/{load_id}/status-history')
                if history_response and history_response.status_code == 200:
                    history = history_response.json()
                    self.log_test("Get Status History", True, f"Found {len(history)} events")
                else:
                    self.log_test("Get Status History", False, "Failed to get history")
            else:
                self.log_test("Update Load Status", False, "Missing response fields")
        else:
            self.log_test("Update Load Status", False, f"Status {response.status_code}: {response.text}")

    def test_ai_assistant(self):
        """Test AI Assistant endpoints"""
        print("\n🤖 Testing AI Assistant...")
        
        # Test chat endpoint
        chat_data = {
            "message": "What loads do I have assigned?"
        }
        
        response = self.api_call('POST', '/ai/chat', chat_data)
        
        if not response:
            self.log_test("AI Chat", False, "Request failed")
            return
        
        if response.status_code == 200:
            data = response.json()
            if 'response' in data:
                self.log_test("AI Chat", True, f"Response length: {len(data['response'])} chars")
                
                # Wait a moment for the chat to be saved
                time.sleep(1)
                
                # Test chat history
                history_response = self.api_call('GET', '/ai/history')
                if history_response and history_response.status_code == 200:
                    history = history_response.json()
                    self.log_test("AI Chat History", True, f"Found {len(history)} messages")
                else:
                    self.log_test("AI Chat History", False, "Failed to get history")
            else:
                self.log_test("AI Chat", False, "Missing response field")
        else:
            error_text = response.text
            if "LLM API key not configured" in error_text:
                self.log_test("AI Chat", False, "LLM API key not configured")
            elif "AI Assistant error" in error_text:
                self.log_test("AI Chat", False, f"AI error: {error_text}")
            else:
                self.log_test("AI Chat", False, f"Status {response.status_code}: {error_text}")

    def test_documents_api(self, load_id):
        """Test document upload and retrieval"""
        if not load_id:
            self.log_test("Documents API", False, "No load ID available")
            return
        
        print("\n📄 Testing Documents API...")
        
        # Test get documents
        response = self.api_call('GET', f'/loads/{load_id}/documents')
        
        if not response:
            self.log_test("Get Load Documents", False, "Request failed")
            return
        
        if response.status_code == 200:
            docs = response.json()
            self.log_test("Get Load Documents", True, f"Found {len(docs)} documents")
            
            # Test document upload (create a simple test file)
            test_content = b"Test document content for POD"
            files = {'file': ('test_pod.txt', test_content, 'text/plain')}
            data = {'doc_type': 'pod'}
            
            upload_response = self.api_call('POST', f'/loads/{load_id}/documents', data=data, files=files)
            
            if upload_response and upload_response.status_code == 200:
                upload_data = upload_response.json()
                if 'document' in upload_data:
                    self.log_test("Upload Document", True, f"Doc ID: {upload_data['document']['id']}")
                else:
                    self.log_test("Upload Document", False, "Missing document data")
            else:
                self.log_test("Upload Document", False, f"Upload failed: {upload_response.status_code if upload_response else 'No response'}")
        else:
            self.log_test("Get Load Documents", False, f"Status {response.status_code}")

    def test_location_api(self):
        """Test location tracking"""
        print("\n📍 Testing Location API...")
        
        # Test location ping
        location_data = {
            "lat": 41.8781,
            "lng": -87.6298,
            "accuracy_m": 5.0,
            "speed_mps": 15.5,
            "heading_deg": 180.0
        }
        
        response = self.api_call('POST', '/location/ping', location_data)
        
        if not response:
            self.log_test("Location Ping", False, "Request failed")
            return
        
        if response.status_code == 200:
            data = response.json()
            if 'message' in data and 'id' in data:
                self.log_test("Location Ping", True, f"Location ID: {data['id']}")
                
                # Test get latest location
                latest_response = self.api_call('GET', '/location/latest')
                if latest_response and latest_response.status_code == 200:
                    latest = latest_response.json()
                    if latest:
                        self.log_test("Get Latest Location", True, f"Lat: {latest.get('lat')}, Lng: {latest.get('lng')}")
                    else:
                        self.log_test("Get Latest Location", True, "No location data")
                else:
                    self.log_test("Get Latest Location", False, "Failed to get latest location")
            else:
                self.log_test("Location Ping", False, "Missing response fields")
        else:
            self.log_test("Location Ping", False, f"Status {response.status_code}")

    def test_messaging_api(self, load_id):
        """Test messaging endpoints"""
        if not load_id:
            self.log_test("Messaging API", False, "No load ID available")
            return
        
        print("\n💬 Testing Messaging API...")
        
        # Test get messages
        response = self.api_call('GET', f'/loads/{load_id}/messages')
        
        if not response:
            self.log_test("Get Load Messages", False, "Request failed")
            return
        
        if response.status_code == 200:
            messages = response.json()
            self.log_test("Get Load Messages", True, f"Found {len(messages)} messages")
            
            # Test send message
            message_data = {
                "content": "Test message from driver mobile app"
            }
            
            send_response = self.api_call('POST', f'/loads/{load_id}/messages', message_data)
            
            if send_response and send_response.status_code == 200:
                send_data = send_response.json()
                if 'message' in send_data:
                    self.log_test("Send Message", True, "Message sent successfully")
                else:
                    self.log_test("Send Message", False, "Missing response data")
            else:
                self.log_test("Send Message", False, f"Send failed: {send_response.status_code if send_response else 'No response'}")
            
            # Test unread count
            count_response = self.api_call('GET', '/messages/unread-count')
            if count_response and count_response.status_code == 200:
                count_data = count_response.json()
                if 'unread_count' in count_data:
                    self.log_test("Get Unread Count", True, f"Unread: {count_data['unread_count']}")
                else:
                    self.log_test("Get Unread Count", False, "Missing count data")
            else:
                self.log_test("Get Unread Count", False, "Failed to get unread count")
        else:
            self.log_test("Get Load Messages", False, f"Status {response.status_code}")

    def test_profile_api(self):
        """Test profile update"""
        print("\n👤 Testing Profile API...")
        
        profile_data = {
            "phone": "+1-555-0123",
            "full_name": "Test Driver Updated"
        }
        
        response = self.api_call('PUT', '/profile', profile_data)
        
        if not response:
            self.log_test("Update Profile", False, "Request failed")
            return
        
        if response.status_code == 200:
            data = response.json()
            if 'id' in data:
                self.log_test("Update Profile", True, f"Profile updated for {data.get('full_name', 'N/A')}")
            else:
                self.log_test("Update Profile", False, "Missing profile data")
        else:
            self.log_test("Update Profile", False, f"Status {response.status_code}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Driver Mobile App Backend Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication is required for all other tests
        if not self.test_driver_login():
            print("\n❌ Authentication failed - stopping tests")
            return False
        
        # Test driver info
        self.test_driver_info()
        
        # Test loads and get a load ID for other tests
        load_id = self.test_loads_api()
        
        # Test status workflow
        self.test_status_workflow(load_id)
        
        # Test AI Assistant
        self.test_ai_assistant()
        
        # Test documents
        self.test_documents_api(load_id)
        
        # Test location tracking
        self.test_location_api()
        
        # Test messaging
        self.test_messaging_api(load_id)
        
        # Test profile
        self.test_profile_api()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test runner"""
    tester = DriverMobileAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open('/app/driver_mobile_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())