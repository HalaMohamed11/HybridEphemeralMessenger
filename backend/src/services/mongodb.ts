import mongoose from 'mongoose';

export const initMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ephemeral-messenger');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// User Schema
const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    displayName: String,
    email: String,
    photoURL: String,
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);

// Create or get user
export const createOrUpdateUser = async (uid: string, userData: any) => {
  try {
    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({
        uid,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
      });
      await user.save();
    } else {
      // Update user data if provided
      if (userData.displayName) user.displayName = userData.displayName;
      if (userData.email) user.email = userData.email;
      if (userData.photoURL) user.photoURL = userData.photoURL;
      await user.save();
    }
    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

export const getUserByUID = async (uid: string) => {
  try {
    return await User.findOne({ uid });
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};
