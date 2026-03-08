const Driver = require("../models/Driver")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// register driver
exports.registerDriver = async(req,res)=>{

try{

const {name,email,password,busNumber} = req.body

const exist = await Driver.findOne({email})

if(exist){
return res.status(400).json({message:"Driver already exists"})
}

const hashedPassword = await bcrypt.hash(password,10)

const driver = new Driver({
name,
email,
password:hashedPassword,
busNumber
})

await driver.save()

res.json({message:"Driver registered successfully"})

}catch(err){

res.status(500).json({message:err.message})

}

}


// login driver

exports.loginDriver = async(req,res)=>{

try{

const {email,password} = req.body

const driver = await Driver.findOne({email})

if(!driver){
return res.status(400).json({message:"Driver not found"})
}

const match = await bcrypt.compare(password,driver.password)

if(!match){
return res.status(400).json({message:"Wrong password"})
}

const token = jwt.sign(
{ id:driver._id },
process.env.JWT_SECRET,
{ expiresIn:"7d" }
)

res.json({
message:"Driver login successful",
token
})

}catch(err){

res.status(500).json({message:err.message})

}

}