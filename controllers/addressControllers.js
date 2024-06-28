const { shippingAddress } = require("../models/AddressModel");
const { users } = require("../models/userModel");

const addAddress = async (req, res) => {
  try {
    const { type, name, country, city, state, zip, address } = req.body;
    const { userId } = req.params;

    if (!userId || !type || !country || !city || !zip || !address) {
      return res
        .status(400)
        .send({ success: false, message: "Missing required fields" });
    }

    if (!["shipping", "billing"].includes(type)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid address type" });
    }

    const newAddress = new shippingAddress({
      user: userId,
      type,
      name,
      country,
      city,
      state,
      zip,
      address,
    });

    await newAddress.save();

    const updateField =
      type === "shipping" ? "shippingAddressIds" : "billingAddressIds";
    await users.findByIdAndUpdate(userId, {
      $push: { [updateField]: newAddress._id },
    });

    res.send({ success: true, data: newAddress });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

const removeAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    // Find the address by ID
    const address = await shippingAddress.findById(addressId);

    if (!address) {
      return res
        .status(404)
        .send({ success: false, message: "Address not found" });
    }

    // Determine the correct address field to update based on the address type
    const updateField =
      address.type === "shipping" ? "shippingAddressIds" : "billingAddressIds";
    // Remove the address ID from the user's address list
    await users.findByIdAndUpdate(address.user, {
      $pull: { [updateField]: address._id },
    });

    console.log(updateField);
    // Delete the address
    await address.deleteOne();

    res.send({ success: true, message: "Address removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

module.exports = { addAddress, removeAddress };
