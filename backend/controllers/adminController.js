const Admin = require("../models/Admin")
const Driver = require("../models/Driver")
const Bus = require("../models/Bus")

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// admin register
exports.registerAdmin = async(req,res)=>{

const {name,email,password} = req.body

const hashed = await bcrypt.hash(password,10)

const admin = new Admin({
name,
email,
password:hashed
})

await admin.save()

res.json({message:"Admin created"})

}


// admin login
exports.loginAdmin = async(req,res)=>{

const {email,password} = req.body

const admin = await Admin.findOne({email})

if(!admin){
return res.status(400).json({message:"Admin not found"})
}

const match = await bcrypt.compare(password,admin.password)

if(!match){
return res.status(400).json({message:"Wrong password"})
}

const token = jwt.sign(
{ id:admin._id },
process.env.JWT_SECRET,
{expiresIn:"7d"}
)

res.json({token})

}


// get drivers
exports.getDrivers = async(req,res)=>{

const drivers = await Driver.find()

res.json(drivers)

}


// get buses
exports.getBuses = async(req,res)=>{

const buses = await Bus.find()

res.json(buses)

}