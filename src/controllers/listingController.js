// controllers/listingController.js
import Listing from "../models/Listing.js";
import { io, onlineUsers } from "../server.js";

// Receiver claims a listing
export const claimListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const receiverId = req.user.id; // from auth middleware

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });

    listing.claimedBy = receiverId;
    listing.status = "claimed";
    await listing.save();

    // Notify Donor in real time
    const donorSocketId = onlineUsers.get(listing.donorId?.toString());
    if (donorSocketId) {
      io.to(donorSocketId).emit("listingClaimed", {
        message: "Your listing has been claimed!",
        listingId,
        receiverId,
      });
    }

    res.json({ success: true, message: "Listing claimed successfully", listing });
  } catch (err) {
    console.error("Error claiming listing:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Donor confirms pickup
export const confirmPickup = async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });

    listing.status = "pickedup";
    await listing.save();

    // Notify Receiver
    const receiverSocketId = onlineUsers.get(listing.claimedBy?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("pickupConfirmed", {
        message: "Your pickup has been confirmed!",
        listingId,
      });
    }

    res.json({ success: true, message: "Pickup confirmed successfully" });
  } catch (err) {
    console.error("Error confirming pickup:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
