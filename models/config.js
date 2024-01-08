const mongoose = require("mongoose");

const config = new mongoose.Schema({
    lastSyncBlock: { type: String, default:0,required: true },
},
    { timestamps: true, collection: "config" }
);

module.exports = mongoose.model("config", config);
