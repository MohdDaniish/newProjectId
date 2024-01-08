// event Claim(address indexed user, uint roi);

const mongoose = require("mongoose");

const claim = new mongoose.Schema({
    user: { type: String, required: true },
    roi: { type: Number, required: true },
    txHash: { type: String, required: true ,unique:true},
    block: { type: Number, required: true },
    timestamp: { type: Number, required: true },
},
    { timestamps: true, collection: "claim" }
);

module.exports = mongoose.model("claim", claim);
