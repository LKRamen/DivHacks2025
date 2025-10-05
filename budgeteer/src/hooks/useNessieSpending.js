import { useState, useEffect, useCallback } from 'react';

// Category mapping
const CATEGORY_MAPPING = {
  "Shopping": [
    'shopping', 'Shopping', 'department store', 'Department Store', 
    'department_store', 'shopping_mall', 'Store', 'store', 'retail', 
    'Retail', 'Wholesale', 'clothing_store', 'Clothing', 'clothing', 
    'Clothes', 'Fashion', 'athletic wear', 'shoe_store', 'jewelry_store', 
    'Jewelry', 'furniture_store', 'Furniture', 'FURNITURE', 'home_goods_store',
    'hardware_store', 'book_store', 'florist', 'Electronics', 'electronics',
    'electronics_store', 'Tech', 'tech', 'Technology', 'laptop', 'phones',
    'Headphones', 'bicycle_store', 'pet_store', 'pets', 'Dogs', 'dog',
    'Office Supplies', 'School Supplies', 'Textbooks', 'convenience_store',
    'convenience', 'Convenience Store', 'Cosmetics', 'Beauty', 'beauty_salon',
    'Hair Salon', 'hair_care', 'Manicure', 'specialty', 'necessities',
    'essentials', 'Online Vendor', 'Merchandising'
  ],
  
  "Food & Dining": [
    'Food', 'food', 'Food and Beverage', 'Restaurant', 'restaurant',
    'Restaurants', 'fast food', 'fastfood', 'Cafe', 'cafe', 'Coffee',
    'coffee', 'bar', 'Bars', 'Drinks', 'drink', 'liquor_store',
    'Groceries', 'groceries', 'Grocery', 'grocery', 'grocery store',
    'grocery_or_supermarket', 'Supermarket', 'supermarket', 'market',
    'bakery', 'Baked Goods', 'Pizza Restaurant', 'pizza', 'tacos',
    'Burritos', 'burritos', 'TexMex', 'sandwiches', 'Salads', 'salads',
    'barbecue', 'American Restaurant', 'American', 'French', 'Indian',
    'meal_delivery', 'meal_takeaway', 'catering', 'night_club',
    'Night Club', 'Pharmacy, Food, Grocery'
  ],
  
  "Savings & Investment": [
    'Bank', 'bank', 'Banking', 'finance', 'investing', 'loan',
    'Credit Card', 'Cards', 'atm', 'Exchange', 'Rewards'
  ],
  
  "Entertainment": [
    'Entertainment', 'entertainment', 'enterntainment', 'Fun', 'fun',
    'Music', 'music', 'musician', 'Musician', 'Music Label', 'musica',
    'recordCompany', 'orchestra', 'movie', 'movie_theater', 'Film',
    'video', 'tv', 'casino', 'amusement_park', 'bowling_alley',
    'zoo', 'museum', 'art_gallery', 'stadium', 'Sports', 'sports',
    'BBall', 'park', 'Rec', 'Vacation', 'Travel', 'travel',
    'travel_agency', 'Hotel', 'Lodging', 'lodging', 'Hospitality',
    'flights', 'airline', 'Car Rental', 'car rental', 'car_rental'
  ],
  
  "Bills & Subscriptions": [
    'Utilities', 'bill', 'electricity', 'Power', 'Energy', 'rent',
    'insurance_agency', 'Internet', 'internet', 'Web', 'laundry',
    'Laundry', 'storage', 'parking'
  ],
  
  "Health & Fitness": [
    'Health', 'health', 'Healthcare', 'gym', 'spa', 'Pharmacy',
    'pharmacy', 'drugs', 'hospital', 'doctor', 'veterinary_care'
  ],
  
  "Transportation": [
    'Transportation', 'transportation', 'Transport', 'car', 'Cars',
    'Automobile', 'car_dealer', 'car_repair', 'car_wash', 'gas_station',
    'gas', 'fuel', 'oil'
  ],
  
  "Miscellaneous": [
    'General', 'general', 'GENERAL', 'Other', 'Default', 'Category',
    'establishment', 'point_of_interest', 'library', 'school',
    'university', 'Education', 'education', 'Real Estate',
    'real_estate_agency', 'Residential', 'moving_company', 'locksmith',
    'general_contractor', 'post_office', 'local_government_office',
    'government', 'Charity', 'charity', 'Non-Profit', 'non-profit',
    'nonprofit', 'funeral_home', 'Global', 'Sustainability',
    'Environment', 'Children', 'Women', 'Disabled', 'Low-Income',
    'Justice', 'Christian', 'Farming', 'premise', 'natural_feature',
    'U.S.', 'NYC', 'Africa', 'Digital Solutions Company', 'owner',
    'Senator', 'Personal', 'everything', 'stuff', 'Hackathon',
    'hackathon', 'Marvel'
  ]
};

/**
 * Helper function to find umbrella category for a subcategory
 */
const getUmbrellaCategory = (subcategory) => {
  for (const [umbrella, subcategories] of Object.entries(CATEGORY_MAPPING)) {
    if (subcategories.includes(subcategory)) {
      return umbrella;
    }
  }
  return "Miscellaneous";
};

/**
 * Custom hook to fetch spending data based on user's full name
 * @param {Object} user - User object with firstName and lastName (or name property)
 * @returns {Object} { data, loading, error, refetch }
 */
const useNessieSpending = (user) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiKey = process.env.REACT_APP_NESSIE_API_KEY;

  const fetchSpendingData = useCallback(async () => {
    // Don't fetch if user is not available yet
    if (!user) {
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
      // Parse user name
      let firstName, lastName;
      if (user.name) {
        // If name is a single string, split it
        const nameParts = user.name.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts[nameParts.length - 1];
      } else if (user.given_name && user.family_name) {
        // Auth0 also provides given_name and family_name
        firstName = user.given_name;
        lastName = user.family_name;
      } else {
        throw new Error('Unable to parse user name');
      }

      console.log(`Searching for customer: ${firstName} ${lastName}`);


      // Step 1: Fetch all customers
      const customersResponse = await fetch(
        `http://api.nessieisreal.com/customers?key=${apiKey}`
      );

      if (!customersResponse.ok) {
        throw new Error(`Failed to fetch customers: ${customersResponse.status}`);
      }

      const customers = await customersResponse.json();
      console.log("All customers:", customers);

      // Step 2: Find matching customer by name
      const matchingCustomer = customers.find(customer => 
        customer.first_name?.toLowerCase() === firstName?.toLowerCase() &&
        customer.last_name?.toLowerCase() === lastName?.toLowerCase()
      );

      if (!matchingCustomer) {
        throw new Error(`No customer found with name: ${firstName} ${lastName}`);
      }

      console.log("Matching customer:", matchingCustomer);
      const customerId = matchingCustomer._id;

      // Step 3: Fetch customer's accounts
      const accountsResponse = await fetch(
        `http://api.nessieisreal.com/customers/${customerId}/accounts?key=${apiKey}`
      );

      if (!accountsResponse.ok) {
        throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
      }

      const accounts = await accountsResponse.json();
      console.log("Customer accounts:", accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found for this customer');
      }

      // Use the first account (or you could aggregate across all accounts)
      const accountId = accounts[0]._id;

      // Step 4: Fetch purchases for the account
      const purchasesResponse = await fetch(
        `http://api.nessieisreal.com/accounts/${accountId}/purchases?key=${apiKey}`
      );

      if (!purchasesResponse.ok) {
        throw new Error(`Failed to fetch purchases: ${purchasesResponse.status}`);
      }

      const purchases = await purchasesResponse.json();
      console.log("Purchases:", purchases);

      // Step 5: Fetch all merchants (we'll need this to map merchant_id to categories)
      const merchantsResponse = await fetch(
        `http://api.nessieisreal.com/merchants?key=${apiKey}`
      );

      if (!merchantsResponse.ok) {
        throw new Error(`Failed to fetch merchants: ${merchantsResponse.status}`);
      }

      const merchants = await merchantsResponse.json();
      console.log("Merchants:", merchants);

      // Create a merchant lookup map
      const merchantMap = {};
      merchants.forEach(merchant => {
        merchantMap[merchant._id] = merchant;
      });

      // Step 6: Initialize category totals
      const categoryTotals = {
        "Shopping": 0,
        "Food & Dining": 0,
        "Savings & Investment": 0,
        "Entertainment": 0,
        "Bills & Subscriptions": 0,
        "Health & Fitness": 0,
        "Transportation": 0,
        "Miscellaneous": 0
      };

      let totalSpending = 0;

      // Step 7: Process each purchase
      purchases.forEach(purchase => {
        const amount = purchase.amount || 0;
        totalSpending += amount;

        // Get merchant for this purchase
        const merchant = merchantMap[purchase.merchant_id];

        if (merchant && merchant.category && merchant.category.length > 0) {
          // Get the first category
          const firstCategory = merchant.category[0];
          
          // Find umbrella category
          const umbrellaCategory = getUmbrellaCategory(firstCategory);
          
          // Add amount to the umbrella category
          categoryTotals[umbrellaCategory] += amount;

          console.log(`Purchase $${amount} -> ${firstCategory} -> ${umbrellaCategory}`);
          merchantMap[purchase.merchant_id]['category'] = umbrellaCategory;
        } else {
          // No category found, add to Miscellaneous
          categoryTotals["Miscellaneous"] += amount;
          console.log(`Purchase $${amount} -> No category -> Miscellaneous`);
        }
      });

      // Step 8: Set the data
      setData({
        customerId: customerId,
        customerName: `${matchingCustomer.first_name} ${matchingCustomer.last_name}`,
        accountId: accountId,
        categoryTotals: categoryTotals,
        totalSpending: totalSpending,
        purchaseCount: purchases.length,
        rawPurchases: purchases,
        merchantMap: merchantMap
      });

    } catch (err) {
      console.error("Error fetching spending data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, apiKey]);

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