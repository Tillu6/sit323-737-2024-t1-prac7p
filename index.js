// index.js
const express = require('express');
const logger  = require('./logger');
const { connect } = require('./db');

const app = express();
app.use(express.json());

// Routes that don't need DB:
app.get('/',       (req, res) => res.send('Calculator Microservice v2 is up and running!'));
app.get('/version',(req, res) => res.json({ version: 'v2', message: 'Calculator v2' }));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`v2 | [${req.method}] ${req.url}`);
  next();
});

let historyColl;

// Core calculation logic (unchanged)
const calculate = (n1, n2, op) => {
  if (isNaN(n1) || (n2 !== undefined && isNaN(n2))) {
    throw new Error('Invalid numbers.');
  }
  switch (op) {
    case 'add':      return n1 + n2;
    case 'subtract': return n1 - n2;
    case 'multiply': return n1 * n2;
    case 'divide':
      if (n2 === 0) throw new Error('Divide by zero.');
      return n1 / n2;
    case 'power':    return Math.pow(n1, n2);
    case 'mod':
      if (n2 === 0) throw new Error('Modulo by zero.');
      return n1 % n2;
    case 'sqrt':
      if (n1 < 0) throw new Error('Sqrt of negative.');
      return Math.sqrt(n1);
    default:
      throw new Error('Unknown operation.');
  }
};

// Once DB is connected and collection is set, wire up the routes and start listening
connect()
  .then(db => {
    historyColl = db.collection('calculations');
    logger.info('✅ MongoDB connected, collection ready');

    // CRUD endpoints using historyColl
    ['add','subtract','multiply','divide','power'].forEach(op => {
      app.get(`/${op}`, async (req, res) => {
        const n1 = parseFloat(req.query.num1);
        const n2 = parseFloat(req.query.num2);
        try {
          const result = calculate(n1, n2, op);
          await historyColl.insertOne({ op, n1, n2, result, ts: new Date() });
          logger.info(`v2 | ${op}(${n1},${n2})=${result}`);
          res.json({ result });
        } catch (err) {
          logger.error(`v2 | Error ${op}: ${err.message}`);
          res.status(400).json({ error: err.message });
        }
      });
    });

    app.get('/mod', async (req, res) => {
      const n1 = parseFloat(req.query.num1);
      const n2 = parseFloat(req.query.num2);
      try {
        const result = calculate(n1, n2, 'mod');
        await historyColl.insertOne({ op:'mod', n1, n2, result, ts: new Date() });
        res.json({ result });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.get('/sqrt', async (req, res) => {
      const n1 = parseFloat(req.query.num);
      try {
        const result = calculate(n1, undefined, 'sqrt');
        await historyColl.insertOne({ op:'sqrt', n1, result, ts: new Date() });
        res.json({ result });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // History endpoint
    app.get('/history', async (_, res) => {
      const recent = await historyColl.find().sort({ ts:-1 }).limit(50).toArray();
      res.json(recent);
    });

    // Start server _only after_ DB is ready
    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      logger.info(`Calculator v2 listening on port ${port}`)
    );
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });
