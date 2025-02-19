import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    governmentId: { type: String, required: true },
    societyName: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    role: { type: String, enum: ["master-admin", "admin", "user"], default: "user" },
    deviceList: [{ type: String , default:[] }], // Stores productIds of associated devices
    profilePicture: { type: String },
    documentId: { type: String },
    registeredOn: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false }
});

// 🔒 Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 🔑 Generate JWT Token
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// 🔑 Compare Passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    console.log(enteredPassword , this.password);
    return await bcrypt.compare(enteredPassword, this.password);

};

const User = mongoose.model("users", userSchema);
export default User;
