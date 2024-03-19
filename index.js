const fs = require('fs');
const readline = require('readline');

const input = fs.readFileSync('sample_wage_data.json');
const inputData = JSON.parse(input);

// Define conversion rates
const currencyRates = inputData.currencyRates;

let outputData = [];
x

function calculateBalance(employeeId) {
  const employee = inputData.employeeWageData.find(emp => emp.employeeID === employeeId);
  if (employee) {
    return employee.totalEarnedWages;
  } else {
    throw new Error(`Employee with ID ${employeeId} not found.`);
  }
}

function processRequest(request, employee) {
  let remainingBalance = employee.totalEarnedWages;
  let approvalStatus = false;

  // Check if the requested amount is within the available balance
  if (request.requestedCurrency === employee.currency) {
    if (request.requestedAmount <= remainingBalance) {
      remainingBalance -= request.requestedAmount;
      approvalStatus = true;
    }
  } else {
    // Convert requested amount to employee's currency
    const convertedAmount = convertCurrency(request.requestedAmount, request.requestedCurrency, employee.currency);
    if (convertedAmount <= remainingBalance) {
      remainingBalance -= convertedAmount;
      approvalStatus = true;
    }
  }

  return {
    approvalStatus,
    remainingBalance
  };
}

function convertCurrency(amount, fromCurrency, toCurrency) {
  let convertedAmount = amount;
  if (fromCurrency === 'USD' && toCurrency === 'ARS') {
    convertedAmount *= currencyRates['USD_ARS'];
  } else if (fromCurrency === 'ARS' && toCurrency === 'USD') {
    convertedAmount *= currencyRates['ARS_USD'];
  } else {
    throw new Error('Currency conversion not supported for the provided currencies.');
  }
  return convertedAmount;
}

// Function to handle user commands
function handleCommand(command, args) {
  try {
    switch (command) {
      case 'balance':
        const employeeId = args[0];
        const balance = calculateBalance(employeeId);
        console.log(`Real-time balance for employee ${employeeId}: ${balance}`);
        break;
      case 'process':
        const requestId = args[0];
        const request = inputData.wageAccessRequests.find(req => req.requestID === requestId);
        const employee = inputData.employeeWageData.find(emp => emp.employeeID === request.employeeID);
        const result = processRequest(request, employee);
        console.log(`Request ID: ${requestId}, Approval Status: ${result.approvalStatus}, Remaining Balance: ${result.remainingBalance}`);
        // Update totalEarnedWages in employee data
        employee.totalEarnedWages = result.remainingBalance;
        // Add request data to output array
        outputData.push({
          requestID: requestId,
          employeeID: request.employeeID,
          requestedAmount: request.requestedAmount,
          requestedCurrency: request.requestedCurrency,
          approvalStatus: result.approvalStatus,
          remainingBalance: result.remainingBalance
        });
        break;
      case 'exit':
        writeOutput();
        rl.close();
        process.exit();
      default:
        console.log('Invalid command. Please enter a valid command.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (command === 'process') {
      // Add failed request data to output array
      outputData.push({
        requestID: args[0],
        approvalStatus: false,
        errorMessage: error.message
      });
    }
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for commands
rl.setPrompt('Enter command: ');
rl.prompt();

// Handle user input
rl.on('line', (input) => {
  const [command, ...args] = input.trim().split(' ');
  handleCommand(command, args);
  rl.prompt();
});

// Function to write output data to JSON file
function writeOutput() {
  fs.writeFileSync('output.json', JSON.stringify(outputData, null, 2));
}

// Instructions for running the program: 
// Run the script using Node.js: 'node index.js'
// Enter commands in the console to interact with the functionalities, for example: 'balance E01' or 'process R02'.
// Enter "exit" to terminate the program and creates JSON output.
