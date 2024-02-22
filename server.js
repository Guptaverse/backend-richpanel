const express = require("express")
const cors = require('cors')
require('dotenv').config();
const app = express()
const mongoURI = process.env.MONGO_URI
const mongoose = require("mongoose");
const PORT = 5000
const apiRoutes = require('./routes/apiRoutes')
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }))


async function connectTOMongoDB(uri){
    try{
        await mongoose.connect(uri);
        console.log('Connected To DB');
    }
    catch(err){
        console.log(err.message);
    }
}

connectTOMongoDB(mongoURI)

app.get("/",(req,res)=>{
    res.send("All is well!")
} );
app.use("/api",apiRoutes);

// Add support for GET requests to our webhook
app.get("/webhook", (req, res) => {
    // Parse the query params
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
    console.log(req.body)
    // Check if a token and mode is in the query string of the request
    if (mode && token) {
      // Check the mode and token sent is correct
      if (mode === "subscribe" && token === "EAAaLElJ5UXABO8k1w0ZBlDdVlRNIqZAKXgQafZApFhq1uW1VRy4WQouizpUPlwHWRfVXoBZCy9ToGmBacU23dyaPrrZAQXWJ3tKIWi2IthadoSsSUS2wvgqmm9SI4VR6SDVINs81OVMQJuZCzeq9AskqVdgwyTC9pGvykBpWZBN0PPb1iITrtTeTdjZA") {
        // Respond with the challenge token from the request
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);
      }
    }
  });
  
  // Create the endpoint for your webhook
  app.post("/webhook", (req, res) => {
    let body = req.body;
    console.log("BODY : ",body)
    console.log(`\u{1F7EA} Received webhook:`);
    console.dir(body, { depth: null });
  
    // Check if this is an event from a page subscription
    if (body.object === "page") {
      // Returns a '200 OK' response to all requests
      res.status(200).send("EVENT_RECEIVED");
  
      // Iterate over each entry - there may be multiple if batched
      body.entry.forEach(async function (entry) {
        if ("changes" in entry) {
          // Handle Page Changes event
          let receiveMessage = new Receive();
          if (entry.changes[0].field === "feed") {
            let change = entry.changes[0].value;
            switch (change.item) {
              case "post":
                return receiveMessage.handlePrivateReply(
                  "post_id",
                  change.post_id
                );
              case "comment":
                return receiveMessage.handlePrivateReply(
                  "comment_id",
                  change.comment_id
                );
              default:
                console.warn("Unsupported feed change type.");
                return;
            }
          }
        }
  
        // Iterate over webhook events - there may be multiple
        entry.messaging.forEach(async function (webhookEvent) {
          // Discard uninteresting events
          if ("read" in webhookEvent) {
            console.log("Got a read event");
            return;
          } else if ("delivery" in webhookEvent) {
            console.log("Got a delivery event");
            return;
          } else if (webhookEvent.message && webhookEvent.message.is_echo) {
            console.log(
              "Got an echo of our send, mid = " + webhookEvent.message.mid
            );
            return;
          }
  
          // Get the sender PSID
          let senderPsid = webhookEvent.sender.id;
          // Get the user_ref if from Chat plugin logged in user
          let user_ref = webhookEvent.sender.user_ref;
          // Check if user is guest from Chat plugin guest user
          let guestUser = isGuestUser(webhookEvent);
  
          if (senderPsid != null && senderPsid != undefined) {
            if (!(senderPsid in users)) {
              if (!guestUser) {
                // Make call to UserProfile API only if user is not guest
                let user = new User(senderPsid);
                GraphApi.getUserProfile(senderPsid)
                  .then((userProfile) => {
                    user.setProfile(userProfile);
                  })
                  .catch((error) => {
                    // The profile is unavailable
                    console.log(JSON.stringify(body));
                    console.log("Profile is unavailable:", error);
                  })
                  .finally(() => {
                    console.log("locale: " + user.locale);
                    users[senderPsid] = user;
                    i18n.setLocale("en_US");
                    console.log(
                      "New Profile PSID:",
                      senderPsid,
                      "with locale:",
                      i18n.getLocale()
                    );
                    return receiveAndReturn(
                      users[senderPsid],
                      webhookEvent,
                      false
                    );
                  });
              } else {
                setDefaultUser(senderPsid);
                return receiveAndReturn(users[senderPsid], webhookEvent, false);
              }
            } else {
              i18n.setLocale(users[senderPsid].locale);
              console.log(
                "Profile already exists PSID:",
                senderPsid,
                "with locale:",
                i18n.getLocale()
              );
              return receiveAndReturn(users[senderPsid], webhookEvent, false);
            }
          } else if (user_ref != null && user_ref != undefined) {
            // Handle user_ref
            setDefaultUser(user_ref);
            return receiveAndReturn(users[user_ref], webhookEvent, true);
          }
        });
      });
    } else {
      // Return a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  });

// app.post('/reply',(req,res)=>{

// })
app.listen(PORT, () => {
    console.log("Server is running at", PORT);
});