const mongoose = require("mongoose");

const rankAchive = new mongoose.Schema(
    {
        user: { type: String, required: true },
        rank: { type: Number, required: true },
        rankBonus: { type: Number, required: true },
        txHash: { type: String, required: true},
        block: { type: Number, required: true },
        timestamp: { type: Number, required: true },
    },
    { timestamps: true, collection: "rankAchive" }
);

module.exports = mongoose.model("rankAchive", rankAchive);
