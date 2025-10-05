import React from "react";

// Example props: pass in your transaction JSON array as `transactions`
function TransactionStatement({ transactions }) {
  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

      {transactions && transactions.length > 0 ? (
        <ul className="space-y-4">
          {transactions.map((txn) => (
            <li
              key={txn._id}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <div>
                <p className="font-medium text-gray-200">{txn.name}</p>
                <p className="text-sm text-gray-400">
                  {txn.address?.street_number || ""}{" "}
                  {txn.address?.street_name || ""}{" "}
                  {txn.address?.city || ""} {txn.address?.state || ""}
                </p>
              </div>
              <div className="text-sm text-gray-400">
                {txn.category?.[0] || "Uncategorized"}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No transactions available.</p>
      )}
    </div>
  );
}

export default TransactionStatement;
