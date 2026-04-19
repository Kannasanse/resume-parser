require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const resumeRoutes = require('./routes/resumes');
const jobRoutes = require('./routes/jobs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('[:date[clf]] :method :url :status :res[content-length] bytes - :response-time ms'));

app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/jobs', jobRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;
