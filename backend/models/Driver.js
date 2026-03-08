const mongoose = require("mongoose")

const driverSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
required:true,
unique:true
},

password:{
type:String,
required:true
},

busNumber:{
type:String
}

})

module.exports = mongoose.model("Driver",driverSchema)