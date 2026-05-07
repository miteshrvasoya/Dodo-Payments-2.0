const axios = require('axios');

const TOTAL_REQUESTS = 10;

async function run() {
  const requests = [];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    requests.push(
      axios.post(
        'http://localhost:3000/invoices/dfcb20e6-3f79-42d6-88b3-e71e1560c347/pay',
        {
          card_token: 'tok_success'

        },
        {
          headers: {
            Authorization: 'Bearer whsec_acme_secret_123',
            'Idempotency-Key': `payment-${i}`
          }
        }
      )
      .then(res => ({
        success: true,
        data: res.data
      }))
      .catch(err => ({
        success: false,
        data: err.response?.data || err.message
      }))
    );
  }

  const results = await Promise.all(requests);

  console.log(JSON.stringify(results, null, 2));
}

run();