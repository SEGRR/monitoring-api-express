import mongoose from "mongoose";

const sensorDataSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true, index: true },
        slaveId: { type: String, required: true, index: true },
        timestamp: { type: Date, required: true, index: true },
        flowRate: { type: Number, required: true },
        totalFlow: { type: Number, required: true }
    },
    {
        collection: "water-sensor-data", // 🔹 Ensure it uses the existing collection
        timestamps: false // ⛔ Disable automatic createdAt & updatedAt fields
    }
);

// Create a time-series collection in MongoDB (if using MongoDB 5.0+)

const SensorData = mongoose.model("water-sensor-data", sensorDataSchema);

export default SensorData;
