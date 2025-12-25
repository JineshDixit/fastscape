const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">1,234</p>
          <p className="text-sm text-green-600 mt-1">+12% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active Units</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">89</p>
          <p className="text-sm text-green-600 mt-1">+5% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">456</p>
          <p className="text-sm text-blue-600 mt-1">+8% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">$24K</p>
          <p className="text-sm text-green-600 mt-1">+15% from last month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rent Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rent Status</h3>
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart placeholder - Rent Status
          </div>
        </div>

        {/* Earning Summary Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Earning Summary</h3>
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
              <option>Last 8 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart placeholder - Earning Summary
          </div>
        </div>
      </div>

      {/* Bookings Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Bookings Overview</h3>
          <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
        <div className="h-80 flex items-center justify-center text-gray-500">
          Chart placeholder - Bookings Overview
        </div>
      </div>
    </div>
  );
};

export default Dashboard;