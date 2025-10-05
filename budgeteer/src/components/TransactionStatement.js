import React from "react";

function TransactionStatement({ transactions, merchantMap = {} }) {
  console.log(transactions);
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <p className="text-gray-400">No transactions available.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

      <ul className="space-y-4 max-h-96 overflow-y-auto">
        {transactions.map((txn) => {
          const merchant = merchantMap[txn?.merchant_id] || {};
          const category = merchant.category || "Uncategorized";
          
          return (
            <li
              key={txn._id}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-200">
                  {merchant.name || "Unknown Merchant"}
                </p>
                <p className="text-sm text-gray-400">
                  {merchant.address?.street_number} {merchant.address?.street_name}
                  {merchant.address?.city && `${merchant.address.city}`}
                  {merchant.address?.state && ` ${merchant.address.state}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(txn.purchase_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold text-gray-200">
                  ${txn.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">{category}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TransactionStatement;