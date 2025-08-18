import React, { useState } from 'react';
import { Bell, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { enhancedNotificationService } from '../services/enhancedNotificationService';

interface NotificationTestProps {
  onClose: () => void;
}

const NotificationTest: React.FC<NotificationTestProps> = ({ onClose }) => {
  const [testResults, setTestResults] = useState<{
    permission: 'granted' | 'denied' | 'default' | null;
    fcmToken: string | null;
    testSent: boolean;
  }>({
    permission: null,
    fcmToken: null,
    testSent: false,
  });

  const runNotificationTest = async () => {
    try {
      // Check current permission
      const permission = Notification.permission;
      setTestResults(prev => ({ ...prev, permission }));

      // Request permission and get FCM token
      const token = await enhancedNotificationService.requestPermission();
      setTestResults(prev => ({ ...prev, fcmToken: token }));

      // Send test notification
      if (token) {
        await enhancedNotificationService.testNotification();
        setTestResults(prev => ({ ...prev, testSent: true }));
      }
    } catch (error) {
      console.error('Notification test failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TestTube className="w-5 h-5 mr-2" />
            Notification Test
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={runNotificationTest}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Bell className="w-4 h-4 mr-2" />
            Run Notification Test
          </button>

          {testResults.permission && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permission Status
                </span>
                <div className="flex items-center">
                  {testResults.permission === 'granted' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    testResults.permission === 'granted' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {testResults.permission}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  FCM Token
                </span>
                <div className="flex items-center">
                  {testResults.fcmToken ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    testResults.fcmToken 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {testResults.fcmToken ? 'Generated' : 'Failed'}
                  </span>
                </div>
              </div>

              {testResults.testSent && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Test Notification
                  </span>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Sent
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="font-medium mb-1">Test Instructions:</p>
            <ul className="space-y-1">
              <li>• Click "Run Notification Test" to check permissions</li>
              <li>• Allow notifications when prompted</li>
              <li>• Look for a test notification to appear</li>
              <li>• Check browser console for detailed logs</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;