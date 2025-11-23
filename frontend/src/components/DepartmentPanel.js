import React from 'react';

const DepartmentPanel = ({ activeDepartment, onDepartmentChange }) => {
  const departments = [
    {
      id: 'dispatch',
      label: 'Dispatch Operations',
      icon: '🚚',
      description: 'Route planning, load assignment, driver dispatch'
    },
    {
      id: 'accounting',
      label: 'Accounting',
      icon: '💰',
      description: 'Invoicing, payments, financial reporting'
    },
    {
      id: 'sales',
      label: 'Sales/Business Development',
      icon: '📈',
      description: 'Lead generation, CRM, rate quotes'
    },
    {
      id: 'hr',
      label: 'HR',
      icon: '👥',
      description: 'Recruitment, training, employee management'
    },
    {
      id: 'maintenance',
      label: 'Fleet Maintenance',
      icon: '🔧',
      description: 'Preventive maintenance, repairs, inspections'
    },
    {
      id: 'safety',
      label: 'Fleet Safety',
      icon: '🛡️',
      description: 'Safety compliance, accident prevention, training'
    }
  ];

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="font-bold text-lg">TMS Departments</h2>
        <p className="text-xs text-blue-100 mt-1">Select a department</p>
      </div>

      {/* Department List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onDepartmentChange(dept.id)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              activeDepartment === dept.id
                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{dept.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${
                  activeDepartment === dept.id ? 'text-white' : 'text-gray-900'
                }`}>
                  {dept.label}
                </div>
                <div className={`text-xs mt-1 ${
                  activeDepartment === dept.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {dept.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          <div className="font-semibold mb-1">🤖 AI-Powered Assistance</div>
          <div>Chat context syncs with selected department</div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPanel;
