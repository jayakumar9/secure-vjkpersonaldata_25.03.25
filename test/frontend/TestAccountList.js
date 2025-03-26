import React, { useState, useEffect } from 'react';

const TestAccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/test/accounts?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeTestData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/test/init', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to initialize test data');
      }

      await fetchAccounts(1);
    } catch (err) {
      setError(err.message);
      console.error('Error initializing test data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handlePageChange = (newPage) => {
    fetchAccounts(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Test Account List</h1>
          <button
            onClick={initializeTestData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Initialize Test Data
          </button>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {accounts.map((account) => (
                <div key={account._id} className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-sm text-gray-400 mb-1 block">
                        #{account.serialNumber}
                      </span>
                      <h3 className="text-xl font-semibold">{account.website}</h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-gray-400">Name:</span> {account.name}</p>
                    <p><span className="text-gray-400">Username:</span> {account.username}</p>
                    <p><span className="text-gray-400">Email:</span> {account.email}</p>
                    <p><span className="text-gray-400">Note:</span> {account.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 rounded ${
                  pagination.hasPrevPage
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded ${
                  pagination.hasNextPage
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>

            <div className="text-center mt-4 text-gray-400">
              Total items: {pagination.totalItems} | Items per page: {pagination.itemsPerPage}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestAccountList; 