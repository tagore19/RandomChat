const { io } = require('../client/node_modules/socket.io-client');

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:8080';

console.log('--- Starting Automated E2E Matchmaking & Chat Test ---');

const clientA = io(SERVER_URL);
const clientB = io(SERVER_URL);

let clientAMatched = false;
let clientBMatched = false;
let messageReceivedByB = false;
let photoReceivedByA = false;
let strangerLeftReceivedByA = false;

clientA.on('connect', () => {
  console.log('✅ Client A connected:', clientA.id);
  clientA.emit('find_stranger');
});

clientA.on('searching', () => {
  console.log('🔍 Client A is searching for a stranger...');
  clientB.connect();
});

clientB.on('connect', () => {
  console.log('✅ Client B connected:', clientB.id);
  clientB.emit('find_stranger');
});

clientA.on('matched', () => {
  console.log('🎉 Client A received "matched" event!');
  clientAMatched = true;
  clientA.emit('chat_message', { id: 'm1', text: 'Hello Stranger from Client A!' });
});

clientB.on('matched', () => {
  console.log('🎉 Client B received "matched" event!');
  clientBMatched = true;
});

clientB.on('chat_message', (msg) => {
  console.log('📩 Client B received message:', msg.text);
  if (msg.text === 'Hello Stranger from Client A!') {
    messageReceivedByB = true;
    clientB.emit('send_photo', { id: 'p1', image: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=' });
  }
});

clientA.on('receive_photo', (photo) => {
  console.log('📸 Client A received ephemeral photo payload successfully!');
  photoReceivedByA = true;
  console.log('⏭️ Client B triggering "skip"...');
  clientB.emit('skip', { autoRequeue: false });
});

clientA.on('stranger_left', () => {
  console.log('🚪 Client A received "stranger_left" event as expected!');
  strangerLeftReceivedByA = true;

  console.log('\n--- Test Results Summary ---');
  console.log('Client A Matched:', clientAMatched);
  console.log('Client B Matched:', clientBMatched);
  console.log('Message Relayed:', messageReceivedByB);
  console.log('Photo Relayed:', photoReceivedByA);
  console.log('Stranger Left Handled:', strangerLeftReceivedByA);

  const allPassed = clientAMatched && clientBMatched && messageReceivedByB && photoReceivedByA && strangerLeftReceivedByA;
  if (allPassed) {
    console.log('🌟 ALL 5 E2E TESTS PASSED PERFECTLY! 🌟');
  } else {
    console.error('❌ Some tests failed');
  }

  clientA.disconnect();
  clientB.disconnect();
  process.exit(allPassed ? 0 : 1);
});

setTimeout(() => {
  console.error('❌ Test timed out after 10s');
  process.exit(1);
}, 10000);
