const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
//const exp = require('constants');
var apn = require('@parse/node-apn');
const PORT = 3000

var options = {
  token: {
    key: "private/AuthKey.p8",
    keyId: "N8JXWQYZ83",
    teamId: "RJ4GXJA5Q7"
  },
  production: true
};

var apnProvider = new apn.Provider(options);

/*app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
})*/

function print(...messages) {
  const message = messages.join(' ');
  console.log(message);

  const date = new Date();
  const logFileName = `./logs/${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.log`;

  fs.appendFile(logFileName, message + '\n', (err) => {
    if (err) throw err;
  });
}

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/day', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/day.json'))
})

app.get('/miniDay', (req, res) => {
  const dayData = JSON.parse(fs.readFileSync('./public/day.json', 'utf8'));
  res.json({letterDay: dayData.letterDay, scheduleType: dayData.scheduleType, period: dayData.period})
})

app.post('/deviceRegistar/', (req, res) => {
  console.log('registering device')
  if (req.body.deviceToken == "DEVICE TOKEN NOT FOUND") {
    console.log("Device token not found.")
    res.json({message: "Error"})
    return
  }
  const deviceData = JSON.parse(fs.readFileSync('./public/device.json', 'utf8'));
  if (deviceData.includes(req.body.deviceToken)) {
    res.json({message: "Device already registered."})
    console.log("device already registered",req.body.deviceToken);
    return
  }
  deviceData.push(req.body.deviceToken);
  fs.writeFileSync('./public/device.json', JSON.stringify(deviceData));
  res.json({message: 'Device registered successfully.'})
  console.log(req.body.deviceToken,"was registered to server.");
})

app.post('/registerActivity/', (req,res) => {
  if (req.body.activityToken == ""){
    console.log("Activity token not found.")
    res.json({message: "Error"})
    return
  }
  const activityData = JSON.parse(fs.readFileSync('./public/registeredwidgets.json', 'utf8'));
  if (activityData.includes(req.body.activityToken)) {
    res.json({message: "Activity already registered."})
    console.log("activity already registered",req.body.activityToken);
    return
  }
  activityData.push(req.body.activityToken);
  fs.writeFileSync('./public/registeredwidgets.json', JSON.stringify(activityData));
  res.json({message: 'Activity registered successfully.'})
})

app.get('/', (req,res) => {
  res.send("I am alive!")
})

app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/panel.html'));
});
// ACTIVITY.START - Allows the token to start an activity
const admininstrationTokens = [
  {
    assigned: "csongardi",
    token: "csongardicisprettyawesome",
    permissions: ["ACTIVITY.START", "ACTIVITY.MODIFY"]
  },
  {
    assigned: "mchutchison",
    token: "microsoftskypesoundeffect",
    permissions: ["ACTIVITY.START", "ACTIVITY.MODIFY"]
  },
  {
    assigned: "sabatino",
    token: "799ae0d9",
    permissions: ["ACTIVITY.START", "ACTIVITY.MODIFY"]
  },
  {
    assigned: "roman",
    token: "microsoftteamspingsound",
    permissions: ["ACTIVITY.START", "ACTIVITY.MODIFY"]
  },
]

app.post('/startActivity', (req, res) => {
  // Clear registeredwidgets.json
  fs.writeFileSync('./public/registeredwidgets.json', JSON.stringify([]));

  // Read device.json
  const deviceData = JSON.parse(fs.readFileSync('./public/device.json', 'utf8'));

  // Update periodNumber and periodFullTitle
  const { periodNumber, periodFullTitle, token, letterDay, scheduleType, periodEnds } = req.body;
  // Do something with periodNumber and periodFullTitle
  const dateString = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
const dateTimeString = `${dateString}T${periodEnds}`;
const date = new Date(dateTimeString);
  // Check if the token has permissions to start an activity
  console.log(token,req.body)
  const adminToken = admininstrationTokens.find(admin => admin.token === token);
  if (!adminToken || !adminToken.permissions.includes("ACTIVITY.START")) {
    res.json({ message: 'Unauthorized to start activity.' });
    //print(new Date().toISOString(),"ACCESS LOG:",adminToken.assigned || "Someone","attempted to start an activity but it failed due to lack of permissions.")
    return;
  }
  console.log(new Date().toISOString(),"ACCESS LOG:",adminToken.assigned || "Someone","successfully started an activity.")
  // Loop through the deviceData array
  for (let i = 0; i < deviceData.length; i++) {
    const deviceToken = deviceData[i];
    // Send a push notification to the device
    var note = new apn.Notification();
note.topic = "me.thebroz.LSCHSCompanion.push-type.liveactivity";
note.pushType = "liveactivity";
note.priority = 5;
note.rawPayload = {
  aps: {
    timestamp: Math.floor(Date.now() / 1000),
    event: "start",
    "content-state": {
      period: periodNumber,
      longPeriod: periodFullTitle.toUpperCase(),
      scheduleType: scheduleType.toUpperCase(),
      timeEnds: ""+(date.getTime()/1000)+"",
      letterDay: letterDay
    },
    "attributes-type": "DayActivityAttributes",
    attributes: {},
    alert: {
      title: "Period Over",
      body: "Period "+periodNumber+" is starting soon."
    },
    sound: "default"
  }
}

    apnProvider.send(note, deviceToken).then(result => {
      console.log(result.failed);
      console.log(result.sent)
    });
  }
  console.log("success wowzers")
  res.json({ message: 'Activity started successfully.' });
});

app.post('/modifyActivity', (req,res) => {
  const deviceData = JSON.parse(fs.readFileSync('./public/registeredwidgets.json', 'utf8'));

  // Update periodNumber and periodFullTitle
  const { periodNumber, periodFullTitle, token, periodEnds } = req.body;
  // Do something with periodNumber and periodFullTitle
  const dateString = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
const dateTimeString = `${dateString}T${periodEnds}`;
const date = new Date(dateTimeString);
  // Check if the token has permissions to start an activity
  console.log(token,req.body)
  const adminToken = admininstrationTokens.find(admin => admin.token === token);
  if (!adminToken || !adminToken.permissions.includes("ACTIVITY.START")) {
    res.json({ message: 'Unauthorized to start activity.' });
    //print(new Date().toISOString(),"ACCESS LOG:",adminToken.assigned || "Someone","attempted to start an activity but it failed due to lack of permissions.")
    return;
  }
  console.log(new Date().toISOString(),"ACCESS LOG:",adminToken.assigned || "Someone","successfully started an activity.")
  // Loop through the deviceData array
  for (let i = 0; i < deviceData.length; i++) {
    const deviceToken = deviceData[i];
    // Send a push notification to the device
    var note = new apn.Notification();
note.topic = "me.thebroz.LSCHSCompanion.push-type.liveactivity";
note.pushType = "liveactivity";
note.priority = 5;
note.rawPayload = {
  aps: {
    timestamp: Math.floor(Date.now() / 1000),
    event: "update",
    "content-state": {
      period: periodNumber,
      longPeriod: periodFullTitle.toUpperCase(),
      timeEnds: ""+(date.getTime()/1000)+"",
    },
    "attributes-type": "DayActivityAttributes",
    attributes: {},
    alert: {
      title: "Period Over",
      body: "Period "+periodNumber+" is starting soon."
    },
    sound: "default"
  }
}

    apnProvider.send(note, deviceToken).then(result => {
      console.log(result.failed);
      console.log(result.sent)
    });
  }
  console.log("success wowzers")
  res.json({ message: 'Activity started successfully.' });
})

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}!`);
});