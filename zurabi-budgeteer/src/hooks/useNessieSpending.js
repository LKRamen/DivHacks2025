import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to fetch bill data for a single account from CapitalOne Nessie API
 * @param {string} accountId - The account ID to fetch bill data for
 * @returns {Object} { data, loading, error, refetch }
 */
const useNessieSpending = (accountId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // React requires REACT_APP_ prefix for env variables
  const apiKey = process.env.REACT_APP_NESSIE_API_KEY;

  const fetchSpendingData = useCallback(async () => {
    if (!accountId) {
      setError('Account ID required');
      setLoading(false);
      return;
    }
    if (!apiKey) {
      setError('API Key required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch account details
      const accountsResponse = await fetch(
        `http://api.nessieisreal.com/enterprise/accounts/${accountId}?key=${apiKey}`
      );

      if (!accountsResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountsResponse.status}`);
      }

      const account = await accountsResponse.json();
      console.log("Account:", account);

      // Fetch all bills (enterprise endpoint)
      const billsResponse = await fetch(
        `http://api.nessieisreal.com/enterprise/bills?key=${apiKey}`
      );

      if (!billsResponse.ok) {
        console.warn(`Failed to fetch bills for account ${account._id}`);
        setData({
          accountId: account._id,
          accountType: account.type,
          balance: account.balance,
          bills: [],
          totalSpending: 0,
          billCount: 0
        });
        return;
      }
      const billsData = await billsResponse.json();
      console.log("All Bills:", billsData);

      // Access the results array from the response object
      const allBills = billsData.results || [];

      // Filter bills for this specific account
      const accountBills = allBills.filter(bill => bill.account_id === accountId);

      // Calculate total spending
      const totalSpending = accountBills.reduce(
        (sum, bill) => sum + (bill.payment_amount || 0),
        0
      );

      // Set the data state
      setData({
        accountId: account._id,
        accountType: account.type,
        balance: account.balance,
        bills: accountBills,
        totalSpending: totalSpending,
        billCount: accountBills.length
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiKey]);

  useEffect(() => {
    fetchSpendingData();
  }, [fetchSpendingData]);

  return {
    data,
    loading,
    error,
    refetch: fetchSpendingData
  };
};

export default useNessieSpending;