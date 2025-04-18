import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import deviceRoutes from './routes/deviceRoutes.js';
import errorHandler from './middleware/errorMiddleware.js';
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import dataRoutes from './routes/dataRoutes.js'
import waterVehicleRoutes from './routes/waterVehicleRoutes.js'
import adminDashboardRoutes from './routes/adminDashboardRoutes.js'
import notificationRouter from './routes/notificationRoutes.js'
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Routes

app.use('/api/devices' , deviceRoutes);
app.use("/api/users", userRoutes);
app.use('/api/admin' , adminRoutes);
app.use('/api/data'  , dataRoutes)
app.use('/api/waterVehicle', waterVehicleRoutes)
app.use('/api/adminDashboard',adminDashboardRoutes)
app.use('/api/notifications', notificationRouter)
app.get('/' , (req ,res)=>{
    res.json({msg:"Hello"})
})

app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
