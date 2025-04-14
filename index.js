const express = require('express');
const logger = require('./logger');

const app = express();
const port = 3000;

// Root route - confirm service is running and display version 2
app.get('/', (req, res) => {
  res.send('Calculator Microservice v2 is up and running!');
});

// New version endpoint to explicitly return version information
app.get('/version', (req, res) => {
  res.json({ version: 'v2', message: 'This is the updated Calculator Microservice version 2' });
});

// Health check route - useful for uptime monitoring tools
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Logging middleware - logs every incoming request with version info
app.use((req, res, next) => {
  logger.info(`v2 | Incoming request: [${req.method}] ${req.url}`);
  next();
});

// Core calculation logic remains the same
const calculate = (num1, num2, operation) => {
  // Validate input
  if (isNaN(num1) || (num2 !== undefined && isNaN(num2))) {
    throw new Error('Invalid numbers provided.');
  }

  // Perform the operation
  switch (operation) {
    case 'add':
      return num1 + num2;
    case 'subtract':
      return num1 - num2;
    case 'multiply':
      return num1 * num2;
    case 'divide':
      if (num2 === 0) throw new Error('Cannot divide by zero.');
      return num1 / num2;
    case 'power':
      return Math.pow(num1, num2);
    case 'mod':
      if (num2 === 0) throw new Error('Cannot perform modulo by zero.');
      return num1 % num2;
    case 'sqrt':
      if (num1 < 0) throw new Error('Cannot take square root of a negative number.');
      return Math.sqrt(num1);
    default:
      throw new Error('Unknown operation.');
  }
};

// Supported arithmetic operations that require two numbers
['add', 'subtract', 'multiply', 'divide', 'power'].forEach((operation) => {
  app.get(`/${operation}`, (req, res) => {
    const num1 = parseFloat(req.query.num1 || req.query.base);
    const num2 = parseFloat(req.query.num2 || req.query.exp);

    try {
      const result = calculate(num1, num2, operation);
      logger.info(`v2 | Success: ${operation}(${num1}, ${num2}) = ${result}`);
      res.json({ result });
    } catch (error) {
      logger.error(`v2 | Error performing ${operation}: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  });
});

// Modulo operation - two number inputs
app.get('/mod', (req, res) => {
  const num1 = parseFloat(req.query.num1);
  const num2 = parseFloat(req.query.num2);

  try {
    const result = calculate(num1, num2, 'mod');
    logger.info(`v2 | Success: ${num1} % ${num2} = ${result}`);
    res.json({ result });
  } catch (error) {
    logger.error(`v2 | Modulo error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// Square root operation - only one number input
app.get('/sqrt', (req, res) => {
  const num = parseFloat(req.query.num);

  try {
    const result = calculate(num, undefined, 'sqrt');
    logger.info(`v2 | Success: √${num} = ${result}`);
    res.json({ result });
  } catch (error) {
    logger.error(`v2 | Square root error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`Calculator Microservice v2 is live at http://localhost:${port}`);
});
