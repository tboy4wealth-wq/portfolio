import Message from "../model/Message.js";

/*
========================================
GET ACTIVE MESSAGES
========================================
*/

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      isArchived: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
========================================
GET ARCHIVED MESSAGES
========================================
*/

export const getArchivedMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      isArchived: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
========================================
GET SINGLE MESSAGE
========================================
*/

export const getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
========================================
MARK AS READ
========================================
*/

export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
========================================
ARCHIVE MESSAGE
========================================
*/

export const archiveMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
      },
      {
        new: true,
      }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message archived successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
========================================
RESTORE MESSAGE
========================================
*/

export const restoreMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: false,
      },
      {
        new: true,
      }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message restored successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
========================================
DELETE MESSAGE
========================================
*/

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message permanently deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
========================================
DASHBOARD STATS
========================================
*/

export const getStats = async (req, res) => {
  try {
    const total = await Message.countDocuments();

    const unread = await Message.countDocuments({
      isRead: false,
      isArchived: false,
    });

    const read = await Message.countDocuments({
      isRead: true,
      isArchived: false,
    });

    const archived = await Message.countDocuments({
      isArchived: true,
    });

    res.status(200).json({
      success: true,
      stats: {
        total,
        unread,
        read,
        archived,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};