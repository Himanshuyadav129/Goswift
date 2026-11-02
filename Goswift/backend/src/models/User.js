const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
    phone: { type: String, trim: true, maxlength: 20 },
    // Drivers who sign up themselves start unapproved; an admin must approve them before they can drive.
    approved: { type: Boolean, default: true },
    // For drivers: the bus they drive
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
    // Forgot password: only the SHA-256 hash of the emailed token is stored
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false }
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return { id: this._id, name: this.name, email: this.email, role: this.role, bus: this.bus, approved: this.approved, phone: this.phone };
};

module.exports = mongoose.model('User', userSchema);
