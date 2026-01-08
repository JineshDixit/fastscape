const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">1,234</p>
          <p className="mt-1 text-sm text-green-600">+12% from last month</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Units</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">89</p>
          <p className="mt-1 text-sm text-green-600">+5% from last month</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">456</p>
          <p className="mt-1 text-sm text-blue-600">+8% from last month</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">$24K</p>
          <p className="mt-1 text-sm text-green-600">+15% from last month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rent Status Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Rent Status</h3>
            <select className="rounded-md border border-gray-300 px-3 py-1 text-sm">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex h-64 items-center justify-center text-gray-500">Chart placeholder - Rent Status</div>
        </div>

        {/* Earning Summary Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Earning Summary</h3>
            <select className="rounded-md border border-gray-300 px-3 py-1 text-sm">
              <option>Last 8 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="flex h-64 items-center justify-center text-gray-500">Chart placeholder - Earning Summary</div>
        </div>
      </div>

      {/* Bookings Overview */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Bookings Overview</h3>
          <select className="rounded-md border border-gray-300 px-3 py-1 text-sm">
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
        <div className="flex h-80 items-center justify-center text-gray-500">Chart placeholder - Bookings Overview</div>
      </div>
    </div>
  );
};

export default Dashboard;
