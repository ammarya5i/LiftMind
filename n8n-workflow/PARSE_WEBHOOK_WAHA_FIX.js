// Parse WAHA webhook and extract data for Supabase queries
const body = $input.first().json;

// TIMESTAMP CHECK - Skip messages older than 2 minutes
const messageTimestamp = body.timestamp || body.time || Date.now();
const currentTime = Date.now();
const messageAge = currentTime - messageTimestamp;
const ageMinutes = messageAge / 60000;

console.log('=== TIMESTAMP CHECK ===');
console.log('Message timestamp:', messageTimestamp);
console.log('Current time:', currentTime);
console.log('Age (minutes):', ageMinutes.toFixed(2));

// Skip messages older than 2 minutes
if (messageAge > 2 * 60 * 1000) {
  console.log('⚠️ REJECTING OLD MESSAGE - Age:', ageMinutes.toFixed(2), 'minutes');
  return {
    json: {
      skip: true,
      reason: 'Message too old: ' + ageMinutes.toFixed(2) + ' minutes',
      timestamp: messageTimestamp,
      currentTime: currentTime
    }
  };
}

// Extract phone number (for Get User query)
let phoneNumber = '';
let messageText = '';
let sessionId = '';

console.log('=== RAW WAHA PAYLOAD ===');
console.log(JSON.stringify(body, null, 2));

// Check for Postman test format FIRST
if (body.phoneNumber && body.message) {
  phoneNumber = body.phoneNumber.replace('@c.us', '').replace('@g.us', '');
  messageText = body.message;
  sessionId = body.sessionId || 'default';
  console.log('✅ Detected Postman test format');
  
  console.log('Parsed phone:', phoneNumber);
  console.log('Parsed message:', messageText);
  console.log('Session ID:', sessionId);
  
  return {
    json: {
      phoneNumber: phoneNumber,
      message: messageText,
      sessionId: sessionId || 'default'
    }
  };
}

// Extract from WAHA payload structure
if (body.body && body.body.payload) {
  const message = body.body.payload;
  
  // Extract phone - format: "905074843917@c.us" -> "905074843917"
  if (message.from) {
    phoneNumber = message.from.replace('@c.us', '').replace('@g.us', '');
  }
  
  // Extract message text
  if (message.body) {
    messageText = message.body;
  } else if (message.text) {
    messageText = message.text;
  }
  
  // Extract session ID
  sessionId = message.sessionId || 'default';
}

// If payload structure is different, try alternative paths
if (!phoneNumber && body.from) {
  phoneNumber = body.from.replace('@c.us', '').replace('@g.us', '');
}

if (!messageText && body.body) {
  messageText = body.body;
}

console.log('Parsed phone:', phoneNumber);
console.log('Parsed message:', messageText);
console.log('Session ID:', sessionId);

// Return structured data for Supabase Get User node
// phoneNumber field will be used in filter: phone = $json.phoneNumber
return {
  json: {
    phoneNumber: phoneNumber,
    message: messageText,
    sessionId: sessionId || 'default'
  }
};
