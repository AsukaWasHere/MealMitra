import Listing from "../models/Listing.js";
import { io, onlineUsers } from "../server.js";

/**
 * @desc    Create a new food listing
 * @route   POST /api/listings
 * @access  Private (Donors only)
 */
export const createListing = async (req, res) => {
  try {
    const { title, description, quantity, location } = req.body;
    if (!title || !description || !quantity || !location) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }
    const listing = await Listing.create({
      title,
      description,
      quantity,
      location,
      donor: req.user.id,
    });
    res.status(201).json({ success: true, message: "Listing created successfully!", listing });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ success: false, message: "Server error while creating listing." });
  }
};

/**
 * @desc    Get all available food listings
 * @route   GET /api/listings
 * @access  Public
 */
export const getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: "available" }).populate("donor", "name email");
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ success: false, message: "Server error while fetching listings." });
  }
};

/**
 * @desc    Get a single food listing by its ID
 * @route   GET /api/listings/:id
 * @access  Public
 */
export const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("donor", "name email");
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found." });
    }
    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error("Error fetching single listing:", error);
    res.status(500).json({ success: false, message: "Server error while fetching the listing." });
  }
};

/**
 * @desc    Claim a food listing
 * @route   POST /api/listings/claim/:id
 * @access  Private (Receivers only)
 */
export const claimListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found." });
        }
        if (listing.donor.toString() === req.user.id) {
            return res.status(403).json({ success: false, message: "You cannot claim your own listing." });
        }
        if (listing.status !== "available") {
            return res.status(400).json({ success: false, message: "This listing has already been claimed." });
        }
        listing.status = "claimed";
        listing.receiver = req.user.id;
        await listing.save();
        const donorSocketId = onlineUsers.get(listing.donor.toString());
        if (donorSocketId) {
            io.to(donorSocketId).emit("listingClaimed", {
                message: `Your listing "${listing.title}" has been claimed!`,
                listingId: listing._id,
                receiverId: req.user.id,
            });
        }
        res.status(200).json({ success: true, message: "Listing claimed successfully!", listing });
    } catch (error) {
        console.error("Error claiming listing:", error);
        res.status(500).json({ success: false, message: "Server error while claiming listing." });
    }
};

/**
 * @desc    Delete a food listing
 * @route   DELETE /api/listings/:id
 * @access  Private (Donors only)
 */
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found." });
    }
    if (listing.donor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "User not authorized to delete this listing." });
    }
    await listing.deleteOne();
    res.status(200).json({ success: true, message: "Listing deleted successfully." });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ success: false, message: "Server error while deleting the listing." });
  }
};