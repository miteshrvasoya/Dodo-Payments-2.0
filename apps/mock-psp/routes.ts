import { Router } from 'express';

const router = Router();

// Endpoint: POST /psp/pay
// Behavior based on card token:
// tok_success -> return success after ~100ms
// tok_insufficient_funds -> return failed with code insufficient_funds
// tok_card_declined -> return failed with code card_declined
// tok_timeout -> sleep 30 seconds then return success
// tok_network_error -> return HTTP 500

router.post('/psp/pay', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  switch (token) {
    case 'tok_success':
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(200).json({ 
        status: 'succeeded', 
        psp_ref: crypto.randomUUID() 
      });
      
    case 'tok_insufficient_funds':
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(400).json({ status: 'failed', code: 'insufficient_funds' });
      
    case 'tok_card_declined':
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(400).json({ status: 'failed', code: 'card_declined' });
      
    case 'tok_timeout':
      await new Promise(resolve => setTimeout(resolve, 30000));
      return res.status(200).json({ 
        status: 'succeeded', 
        psp_ref: crypto.randomUUID() 
      });
      
    case 'tok_network_error':
      // Return 500
      return res.status(500).json({ error: 'Internal Server Error' });
      
    default:
      return res.status(400).json({ error: 'Unknown token' });
  }
});

export default router;
