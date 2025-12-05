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
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <h2 className="font-bold text-base text-gray-900">Departments</h2>
        <p className="text-xs text-gray-500 mt-0.5">Select workspace</p>
      </div>

      {/* Department List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onDepartmentChange(dept.id)}
            className={`w-full text-left p-3 rounded-xl transition-all ${
              activeDepartment === dept.id
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{dept.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${
                  activeDepartment === dept.id ? 'text-white' : 'text-gray-900'
                }`}>
                  {dept.label}
                </div>
                <div className={`text-xs mt-0.5 ${
                  activeDepartment === dept.id ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {dept.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          <div className="font-semibold mb-1">🤖 AI Assistant</div>
          <div className="text-gray-500">Context-aware help</div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPanel;
