import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import errorHandler from './middleware/errorMiddleware.js';
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Routes

app.use('/api/auth', authRoutes);
app.use('/api/devices' , deviceRoutes);

app.get('/' , (req ,res)=>{
    res.json({msg:"Hello"})
})

app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
