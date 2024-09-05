document.addEventListener("DOMContentLoaded", function() {
  loadCart(); // Ensure cart is loaded on DOM content load
});

function loadCart() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartContainer = document.getElementById('cart-container');
  const cartSummary = document.getElementById('cart-summary');
  cartContainer.innerHTML = '';

  if (cart.length === 0) {
      cartContainer.innerHTML = `
          <div class="empty-cart-message">
              <p>Your cart is empty. Add items using the button below.</p>
              <a href="course.html">Go to Course Page</a>
          </div>
      `;
      cartSummary.innerHTML = '';
      return;
  }

  let itemCounts = {};
  cart.forEach(item => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
  });

  let total = 0;
  const itemPrices = {
      'Course (Templates)': 149,
      'Website Development (No payment Gateway)': 999,
      'Website Development (Payment Gateway)': 1999,
      'Marketing Strategy': 1999,
      'SEO Services': 1999
  };

  for (let [item, count] of Object.entries(itemCounts)) {
      const itemBox = document.createElement('div');
      itemBox.classList.add('course-box');
      total += (itemPrices[item] || 0) * count;

      itemBox.innerHTML = `
          <h2>${item} ${count > 1 ? `x${count}` : ''}</h2>
          <button class="remove-from-cart-btn" onclick="removeFromCart('${item}')">Remove</button>
      `;
      cartContainer.appendChild(itemBox);
  }

  // Format the total with commas before displaying it
  const formattedTotal = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  cartSummary.innerHTML = `
      <p>Total: £${formattedTotal}</p>
      <button class="add-to-cart-btn" id="checkout-btn" onclick="proceedToCheckout()">Proceed to Checkout</button>
      <div id="error-message"></div>
  `;
}

function removeFromCart(item) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(cartItem => cartItem !== item);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}
async function proceedToCheckout() {
  try {
      const checkoutButton = document.getElementById("checkout-btn");
      checkoutButton.disabled = true; // Prevent multiple clicks

      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      let itemCounts = {};
      cart.forEach(item => {
          itemCounts[item] = (itemCounts[item] || 0) + 1;
      });

      const itemIds = {
          'Course (Templates)': 1,
          'Website Development (No payment Gateway)': 2,
          'Website Development (Payment Gateway)': 3,
          'Marketing Strategy': 4,
          'SEO Services': 5
      };

      let items = [];
      for (let [item, count] of Object.entries(itemCounts)) {
          items.push({
              id: itemIds[item],
              quantity: count,
          });
      }

      console.log("Sending items to server:", items);

      const response = await fetch('https://optibiz-agency1-1c900b4236c5.herokuapp.com/create-checkout-session', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error('Server Error:', errorData);
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { id } = await response.json();
      console.log("Received session ID:", id);

      const stripe = Stripe('pk_live_51PqLhOFDR0ud356M7EymBKLS9Lwr1DCA8YZDKyc3LrxvfmilhSJiO4re9oYy3INOmgRaEhQBJvIuJ5DG6Zpcl0Gx00W1GMJLua'); // Replace with your Stripe public key
      const result = await stripe.redirectToCheckout({ sessionId: id });

      if (result.error) {
          console.error('Stripe error:', result.error.message);
          document.getElementById('error-message').innerText = 'An error occurred. Please try again.';
      }

      checkoutButton.disabled = false; // Re-enable button on success

  } catch (error) {
      console.error('Error:', error);
      document.getElementById("error-message").innerHTML = "An error occurred. Please try again.";
      document.getElementById('checkout-btn').disabled = false; // Re-enable button on error
  }
}
