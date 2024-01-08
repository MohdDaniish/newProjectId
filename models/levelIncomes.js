// LevelIncome(address indexed sender, address indexed receiver, uint level,uint amount)

const mongoose = require("mongoose");

const levelBonus = new mongoose.Schema({
        sender: { type: String, required: true },
        receiver: { type: String, required: true },
        level: { type: String, required: true },
        amount: { type: Number, required: true },
        txHash: { type: String, required: true },
        block: { type: Number, required: true },
        timestamp: { type: Number, required: true },
    },
    { timestamps: true, collection: "levelBonus" }
);

module.exports = mongoose.model("levelBonus", levelBonus);
