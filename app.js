const express = require("express");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || "8080";

// Middleware to parse JSON request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  // You can handle messages received from clients here
  ws.on("message", (message) => {
    console.log("Received message from client:", message);
  });
});

// Attach WebSocket server to the HTTP server created by Express
const server = app.listen(PORT, () => {
  console.log("Server is Listening on Port ", PORT);
});

// Upgrade HTTP server to WebSocket server for handling WebSocket connections
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Route to handle incoming webhook requests from Razorpay
app.post("/webhook", async (req, res) => {
  try {
    let body = req.body;
    let received_signature = req.get("x-razorpay-signature");
    let secret = "qwerasdfzxcv321";

    var success = Razorpay.validateWebhookSignature(
      JSON.stringify(body),
      received_signature,
      secret
    );
    if (success) {
      console.log("Valid Razorpay webhook received");
    } else {
      let body = req.body;
      // Extract required fields from the incoming JSON
      const { event, payload } = body;
      const { qr_code } = payload;
      const { id, customer_id } = qr_code.entity;

      // Construct a new object with required fields
      const newData = {
        event: event,
        customer_id: customer_id,
        id: id,
      };

      // Convert the new object to a JSON string
      const jsonString = JSON.stringify(newData);

      // Send the JSON string to all connected WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(jsonString);
        }
      });
      console.log("Invalid Razorpay webhook received:", body);
    }

    // Send response to Razorpay confirming receipt of webhook
    res.status(200).end();
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).end();
  }
});

// Route to handle root request
app.get("/", function (req, res) {
  res.status(200).send("Running");
});
