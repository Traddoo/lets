require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');

const app = express();
const PORT = 4000;

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

app.post('/submit-repo', async (req, res) => {
  console.log('Received repo submission:', req.body);

  try {
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error) {
        console.error('Error verifying token:', error);
      } else {
        userId = user.id;
      }
    }

    const repoData = {
      ...req.body,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    // Ensure tags are stored as an array
    if (typeof repoData.tags === 'string') {
      repoData.tags = repoData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    } else if (!Array.isArray(repoData.tags)) {
      repoData.tags = [];
    }

    console.log('Attempting to insert repo:', repoData);
    const { data, error: insertError } = await supabase
      .from('repos')
      .insert([repoData])
      .select();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      console.error('Attempted to insert:', repoData);
      return res.status(400).json({ error: insertError.message, details: insertError.details, data: repoData });
    }

    // Check if data is available, otherwise use repoData
    const responseData = data && data.length > 0 ? data[0] : repoData;
    res.status(201).json({ message: 'Repo submitted successfully', repo: responseData });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/repos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('repos')
      .select('*');
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching repos', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Note: Realtime subscriptions are not supported in Node.js environment
// If you need real-time updates, consider implementing WebSockets or Server-Sent Events
