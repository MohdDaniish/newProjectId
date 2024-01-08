// event EvStake(address indexed user, uint planId, uint wysAmount, uint otherAmt, uint ttlAmt, uint duration);


const mongoose = require("mongoose");

const Stake = new mongoose.Schema({
    user: { type: String, required: true },
    planId: { type: String, required: true },
    wysAmount: { type: Number, required: true },
    otherAmt: { type: Number, required: true },
    ttlAmt: { type: Number, required: true },
    duration: { type: Number, required: true },
    txHash: { type: String, required: true, unique: true },
    block: { type: Number, required: true },
    timestamp: { type: Number, required: true },
},
    { timestamps: true, collection: "Stake" }
);

module.exports = mongoose.model("Stake", Stake);
