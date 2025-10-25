import Listing from "../models/Listing.js";
import User from "../models/User.js";

// Create new listing
export const createListing = async (req, res) => {
  try {
    const { title, description, quantity, location } = req.body;
    const listing = await Listing.create({
      title,
      description,
      quantity,
      location,
      donor: req.user.id,
      status: "available",
    });

    res.status(201).json({ success: true, listing });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ success: false, message: "Failed to create listing" });
  }
};

// Get all listings
export const getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find().populate("donor", "name email");
    res.json({ success: true, listings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch listings" });
  }
};

// Get single listing
export const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("donor", "name email");
    if (!listing)
      return res.status(404).json({ success: false, message: "Listing not found" });
    res.json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch listing" });
  }
};

// Claim listing (Receiver claims Donor’s listing)
export const claimListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing)
      return res.status(404).json({ success: false, message: "Listing not found" });

    if (listing.status !== "available")
      return res.status(400).json({ success: false, message: "Already claimed" });

    listing.status = "claimed";
    listing.receiver = req.user.id;
    await listing.save();

    // ✅ Notify donor via Socket.io
    const io = req.app.get("io");
    io.emit("listingClaimed", {
      donorId: listing.donor,
      receiverId: req.user.id,
      listingId: listing._id,
      message: "Your listing has been claimed!",
    });

    res.json({ success: true, message: "Listing claimed successfully", listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to claim listing" });
  }
};

// Delete listing
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing)
      return res.status(404).json({ success: false, message: "Listing not found" });

    await listing.deleteOne();
    res.json({ success: true, message: "Listing deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete listing" });
  }
};
