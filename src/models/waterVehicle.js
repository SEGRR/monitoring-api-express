import mongoose from "mongoose";

const WaterVehicleSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true },
    deviceId: { type: String, required: true },
    slaveId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    vehicleNo: { type: String, required: true },
    waterInLitres: { type: String, required: true }, // Fixed naming
    geoLat: { type: String, required: true },
    geoLong: { type: String, required: true },
    placeName: { type: String, required: true },
    vehiclePhoto: { type: String },
    entryOn: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false },
  },
  {
    collection: "waterVehicle",
  }
);

export default mongoose.model("waterVehicle", WaterVehicleSchema);
