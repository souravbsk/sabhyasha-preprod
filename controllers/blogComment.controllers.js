const { default: mongoose } = require("mongoose");
const { blogComments } = require("../models/blogCommentModel");

const createBlogComment = async (req, res) => {
  try {
    const { comment, blogId, status } = req.body;

    // Create a new instance of the blogComments model
    const newComment = new blogComments({
      comment,
      blogId,
      status,
    });

    // Save the new comment to the database
    const savedComment = await newComment.save();

    // Return a success response with the saved comment data
    return res.status(201).json({
      message: "Blog comment created successfully",
      data: savedComment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// get all blog comment
const getAllBlogComments = async (req, res) => {
  try {
    console.log("first");

    // Fetch all blog comments and populate blog title
    const comments = await blogComments.find({}).sort({ _id: -1 }).populate({
      path: "blogId",
      select: "title",
    });

    const enrichedComments = comments.map((comment) => ({
      _id: comment._id,
      blogId: comment.blogId,
      comment: comment.comment,
      status: comment.status,
      blogTitle: comment.blogId.title, // Access the populated blog title
    }));

    res.json({ data: enrichedComments, message: "get Success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// update blog comment by id
const updateBlogCommentById = async (req, res) => {
  try {
    const { status } = req.body;
    const { commentId } = req.params;

    const updatedComment = await blogComments
      .findByIdAndUpdate(
        commentId,
        { $set: { status } }, // Only update 'status'
        { new: true } // To return the updated document
      )
      .populate("blogId", "title"); // Populate the 'blogId' field with 'title' from 'blogs' collection

    if (!updatedComment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.status(200).json({
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// delete  comment by id
const deleteCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;
    console.log(commentId, "fdsfsa")

    // Validate ObjectId (optional but recommended)
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Use Mongoose model to delete comment
    const result = await blogComments.deleteOne({ _id: commentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(200).json({
      message: "Comment deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createBlogComment,
  getAllBlogComments,
  updateBlogCommentById,
  deleteCommentById,
};
