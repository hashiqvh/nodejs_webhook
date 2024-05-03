const express = require("express");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || "3000";

// Initialize Razorpay instance with your API key and secret
const razorpayInstance = new Razorpay({
  key_id: "rzp_test_p7AwacNnXgx766", // Replace with your key_id
  key_secret: "gzJt0sorYWtVfHVO3gsa3kyq", // Replace with your key_secret
});

// Middleware to parse JSON request body
app.use(bodyParser.json());

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 }); // Use any available port

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
});

// Route to handle incoming webhook requests from Razorpay
app.post("/webhook", (req, res) => {
  const webhookSignature = req.get("x-razorpay-signature");
  const { body } = req;
  const key="qwerasdfzxcv321";
  console.error("Invalid webhook signature");
  try {
    var message = req.body;
    const received_signature = req.get('x-razorpay-signature');

    var expected_signature = crypto.createHmac('sha256', key).update(JSON.stringify(message)).digest('hex');

    if (received_signature == expected_signature) {
        const json_resp = req.body;
        console.log(json_resp);
    }
    // Process the webhook event
    console.log("Webhook event received:", body);
    // Handle the webhook event according to your requirements

    // Send the event to connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(body));
      }
    });

    // Send response to Razorpay confirming receipt of webhook
    res.status(200).end();
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).end();
  }
});
app.get('/', function(req, res) {
    res.status(200).send("Running")
});
app.listen(PORT, () => {
  console.log("Server is Listening on Port ", PORT);
});
