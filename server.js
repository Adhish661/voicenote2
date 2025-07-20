require('dotenv').config();
const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting (50 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

// Routes
app.post('/api/summarize', limiter, async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validate input
    if (!text || text.split(' ').length > 1000) {
      return res.status(400).json({ error: "Text too long or empty" });
    }
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Summarize text concisely while preserving key points (2-3 sentences max). Maintain original meaning."
        },
        {
          role: "user",
          content: `Summarize: ${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ 
      summary: response.data.choices[0].message.content 
    });
  } catch (error) {
    console.error("Summarization error:", error.response?.data || error.message);
    res.status(500).json({ error: "Summarization failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Summarization endpoint: http://localhost:${PORT}/api/summarize`);
});