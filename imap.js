const Imap = require('imap');
const cheerio = require('cheerio');
const fs = require('fs');

// IMAP configuration
const imapConfig = {
  user: 'the_broz@outlook.com', // Your email address
  password: 'princess98', // Your email password
  host: 'outlook.office365.com', // Outlook IMAP host
  port: 993,
  tls: true
};

// Connect to IMAP server
const imap = new Imap(imapConfig);

// Function to check for A-H Day in email body
function checkForAHDay(body) {
  const $ = cheerio.load(body);
  const text = $('body').text();
  const match = text.match(/[A-H] Day/i);
  return match ? match[0] : null;
}

// Function to search for emails
function searchEmails() {
  imap.openBox('INBOX', true, (err, box) => {
    if (err) throw err;
//, ['FROM', 'noreply@lasalle.myenotice.com']
    const searchCriteria = ['UNSEEN'];
    imap.search(searchCriteria, (err, results) => {
      if (err) throw err;

      const latestEmail = results[results.length - 1]; // Get the latest email
      const fetchOptions = {
        bodies: [''],
        struct: true
      };

      const fetch = imap.fetch(latestEmail, fetchOptions);
      fetch.on('message', (msg, seqno) => {
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', chunk => {
            buffer += chunk.toString('utf8');
          });

          stream.once('end', () => {
            const aHDayFound = checkForAHDay(buffer);
            if (aHDayFound) {
              console.log('Found', aHDayFound);
              // Do something with the email here
              const dayData = JSON.parse(fs.readFileSync('./public/day.json', 'utf8'));
              dayData.letterDay = aHDayFound.split(' ')[0];;
              dayData.period = "1"
              fs.writeFileSync('./public/day.json', JSON.stringify(dayData));
            } else {
              console.log('A-H Day not found in the latest email.');
            }
          });
        });
      });
    });
  });
}

// Schedule the email check at 7:00 AM
function scheduleEmailCheck() {
  const now = new Date();
  const millisTill7 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0) - now;
  if (millisTill7 < 0) {
    millisTill7 += 86400000; // it's after 7am, try 7am tomorrow.
  }
  setTimeout(() => {
    imap.connect(); // Connect to the IMAP server
    searchEmails(); // Search for emails
  }, millisTill7);
}

//scheduleEmailCheck(); // Start the script
imap.connect(); // Connect to the IMAP server
imap.once('ready', () => {
  searchEmails();
})