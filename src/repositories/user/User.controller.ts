import { User } from "../../common/models";
import { userModelType } from "../../common/types/userTypes";

export const createUser = async (userDetails: userModelType) => {
  if (userDetails.fullName || userDetails.dateOfBirth || userDetails.email || userDetails.passwordHash) {
    try {
      const user = await User.create(userDetails);
      if (user) {
        return {
          status: 200,
          message: 'User created successfully',
          data: user
        }
      }
    } catch (error) {
      return {
        status: 400,
        message: 'Failed to create user',
        error: error
      }
    }
  } else {
    return {
      status: 400,
      message: 'User details are missing'
    }
  }
}

export const findUserById = async (userId: string) => {
  try {
    const user = await User.findByPk(userId);
    if (user) {
      return {
        status: 200,
        message: 'User found successfully',
        data: user
      }
    }
  } catch (error) {
    return {
      status: 400,
      message: 'Failed to find user',
      error: error
    }
  }
}

export const findUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ where: { email: email } });
    if (user) {
      return {
        status: 200,
        message: 'User found successfully',
        data: user
      }
    }
  } catch (error) {
    return {
      status: 400,
      message: 'Failed to find user',
      error: error
    }
  }
}

export const updateUserDetails = async (userDetails: userModelType) => {
  try {
    const user = await User.update(userDetails, { where: { id: userDetails.id } });
    if (user) {
      return {
        status: 200,
        message: 'User updated successfully',
        data: user
      }
    }
  } catch (error) {
    return {
      status: 400,
      message: 'Failed to update user',
      error: error
    }
  }
}

