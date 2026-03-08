const mongoose = require("mongoose")

const busSchema = new mongoose.Schema({

busNumber:String,
driverName:String,

latitude:{
type:Number,
default:0
},

longitude:{
type:Number,
default:0
}

})

module.exports = mongoose.model("Bus",busSchema)