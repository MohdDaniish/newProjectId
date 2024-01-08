const mongoose = require("mongoose");
const registration = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique:true },
    uId: { type: Number, required: true, unique:true },
    user: { type: String, required: true, unique:true },
    referrerId: { type: String, required: true },
    rId: { type: Number, required: true },
    referrer: { type: String, required: true },
    rank: {type:Number,default:0},
    directCount: {type:Number,default:0},
    teamCount: {type:Number,default:0},
    directBonus: {type:Number,default:0},
    levelBonus: {type:Number,default:0},
    poolBonus: {type:Number,default:0},
    rankBonus: {type:Number,default:0},
    wysStaked: {type:Number,default:0},
    txHash: { type: String, required: true, unique: true },
    block: { type: Number, required: true },
    timestamp: { type: Number, required: true },
  },
  { timestamps: true, collection: "registration" }
);

module.exports = mongoose.model("registration", registration);
