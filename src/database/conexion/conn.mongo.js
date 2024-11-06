
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();



const URI = process.env.MONGO_URI;

const conn = async () => {
    try {
        await mongoose.connect(URI)
        console.log('DB is connected')
    } catch (error) {
        console.error(error)
    }
}

export default conn;