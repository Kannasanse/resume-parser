require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const resumeRoutes = require('./routes/resumes');
const jobRoutes = require('./routes/jobs');

const app = express();
const PORT = process.env.PORT || 3000;

const extraOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / Postman
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    if (extraOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(morgan('[:date[clf]] :method :url :status :res[content-length] bytes - :response-time ms'));

app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/jobs', jobRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;
