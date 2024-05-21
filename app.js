const express = require("express");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || "3000";

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

  // Handle messages received from clients
  ws.on("message", (message) => {
    console.log("Received message from client:", message);
  });
});

// Attach WebSocket server to the HTTP server created by Express
const server = app.listen(PORT, () => {
  console.log("Server is Listening on Port", PORT);
});

// Upgrade HTTP server to WebSocket server for handling WebSocket connections
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

const processedEventIds = new Set();

// Middleware to check for duplicate events
const checkDuplicateEvent = (req, res, next) => {
  const eventId = req.headers["x-razorpay-event-id"];

  if (processedEventIds.has(eventId)) {
    // Duplicate event, skip processing
    console.log(`Duplicate event with ID ${eventId}. Skipping processing.`);
    res.status(200).send();
  } else {
    // Not a duplicate, continue with the next middleware or route handler
    processedEventIds.add(eventId);
    next();
  }
};

// Route to handle incoming webhook requests from Razorpay
app.post("/webhook", checkDuplicateEvent, async (req, res) => {
  try {
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
      event_id: req.headers["x-razorpay-event-id"],
    };

    // Convert the new object to a JSON string
    const jsonString = JSON.stringify(newData);

    // Send the JSON string to all connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonString);
      }
    });

    console.log(`Processed event with ID ${req.headers["x-razorpay-event-id"]}`);

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
