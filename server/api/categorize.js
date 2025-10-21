import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Updated to use v1 endpoint and correct model name
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

router.post('/categorize', async (req, res) => {
  try {
    const { ingredient } = req.body; // Changed from ingredients array to single ingredient
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (!ingredient || typeof ingredient !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request - single ingredient string required',
        fallback: true
      });
    }
    
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        fallback: true
      });
    }
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'AI service not configured',
        fallback: true
      });
    }
    
    console.log(`Categorizing: ${ingredient}`);
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Categorize this ingredient into ONE category: Dairy, Meat, Vegetable, Fruits, Produce, or Others.
Ingredient: ${ingredient}

Respond with ONLY the category name, nothing else.
Example responses: Dairy, Meat, Fruits, Vegetable, Others`
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // Back to 10 seconds since we're only doing one at a time
      }
    );
    
    const category = response.data.candidates[0].content.parts[0].text.trim();
    
    console.log(`✅ ${ingredient} → ${category}`);
    res.json({ category });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    
    // Return default category on error
    res.json({ category: 'Others' });
  }
});

export default router;