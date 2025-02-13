import mongoose from 'mongoose';

const slaveDeviceSchema = new mongoose.Schema({
    slaveNo: { type: Number, required: true },
    slaveId: { type: String, required: true },
    sourceType: { type: String, required: true },
    measurementUnit: { type: String, required: true },
    pipeSize: { type: Number, required: true },
    location: { type: String, required: true },
    deleted:{type:Boolean , default:false},
    lastUpdated:{type:Date , default: Date.now}
}, { _id: false });

const deviceSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    serialNumber: { type: String, required: true, unique: true },
    deviceLabel: { type: String, required: true },
    connectionType: { type: String, required: true },
    slaveDevices: { type: [slaveDeviceSchema], default: [] },
    enabled: { type: Boolean, default: true },
    installDate: { type: Date, default: Date.now },
    lastUpdated: {type:Date , default: Date.now},
    deleted:{type: Boolean , default:false},
},{collection:'device-metadata'});

const Device = mongoose.model('device-metadata', deviceSchema);
export default Device;
