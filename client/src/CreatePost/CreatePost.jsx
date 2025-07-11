import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createForumPost } from "@/services/forumService";
import { useAuth } from "@/contexts/AuthContext";
import { createApprovalForumPost } from "@/services/reviewService";
const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingModerator, setPendingModerator] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: "", type: "" });
  const navigate = useNavigate();
  useEffect(() => {
    if (modal.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modal.isOpen]);

  const showModal = (message, type = "info") => {
    setModal({ isOpen: true, message, type });
  };

  const closeModal = () => {
    setModal({ isOpen: false, message: "", type: "" });
    if (modal.type === "success" || modal.type === "pending") {
      navigate("/dashboard/forum");
    } else if (modal.type === "auth") {
      navigate("/login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user || !user.id || !user.username) {
      showModal("You must be logged in to create a post.", "auth");
      setIsSubmitting(false);
      return;
    }

    try {
      const postData = {
        title,
        content,
        authorId: user.id,
        authorName: user.username,
      };
      const res = await createForumPost(postData);
      if (res.message.includes("moderator approval")) {
        showModal(res.message, "pending");
      } else if (
        res.message ===
        "Would you like to send this post to moderator for approval?"
      ) {
        setPendingModerator(true);
        showModal(res.message, "moderatorPrompt");
      } else {
        showModal("Post created successfully!", "success");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      if (error.response) {
        if (
          error.response.status === 202 &&
          error.response.data?.message?.includes("moderator approval")
        ) {
          showModal(
            error.response.data.message ||
              "Content is too long. Your post has been submitted for moderator approval.",
            "pending"
          );
        } else if (error.response.status === 401) {
          showModal("Authentication failed. Please log in again.", "auth");
        } else {
          showModal(
            error.response.data?.error ||
              error.response.data?.message ||
              `Error: ${error.message}`,
            "error"
          );
        }
      } else {
        showModal(`An unexpected error occurred: ${error.message}`, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleModeratorDecision = async (decision) => {
    setPendingModerator(false);
    if (decision === "yes") {
      try {
        const postData = {
          title,
          content,
          authorId: user.id,
          authorName: user.username,
        };
        const res = await createApprovalForumPost(postData);
        console.log(res);
        showModal(
          res.message || "Your post has been submitted for moderator approval.",
          "pending"
        );
      } catch (error) {
        showModal(
          error.response?.data?.error ||
            "Failed to submit post for moderator approval.",
          "error"
        );
      }
    } else {
      setModal({ isOpen: false, message: "", type: "" });
    }
  };

  return (
    <div data-theme="luxury" className="min-h-screen bg-base-100 p-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-base-content">
            Create a Post
          </h2>
          <button
            onClick={() => navigate("/dashboard/forum")}
            className="btn btn-outline gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Forum
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card bg-base-200 shadow-xl w-full relative"
        >
          <div className="absolute top-6 right-6 z-10">
            <div className="dropdown dropdown-hover dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle btn-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div
                tabIndex={0}
                className="dropdown-content z-[1] card card-compact w-80 p-2 shadow bg-base-200 text-base-content border border-base-300"
              >
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-3">Posting Guidelines</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-success">✓</span>
                      <span>Keep discussions respectful and constructive</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-success">✓</span>
                      <span>Use clear, descriptive titles</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-success">✓</span>
                      <span>Share academic resources and study tips</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-success">✓</span>
                      <span>Ask questions about courses and assignments</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-error">✗</span>
                      <span>No spam, offensive, or inappropriate content</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-error">✗</span>
                      <span>No sharing of exam answers or cheating</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-error">✗</span>
                      <span>No personal attacks or harassment</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-warning/20 rounded-lg">
                    <p className="text-xs">
                      <strong>Note:</strong> Posts exceeding character limits or
                      containing sensitive content will be reviewed by
                      moderators before publication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body p-6 sm:p-8">
            <div className="space-y-8">
              <div className="form-control w-full">
                <label className="label mb-1.5">
                  <span className="label-text text-lg font-medium">Title</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your post title"
                  className="input input-bordered input-lg w-full focus:input-primary"
                  required
                />
              </div>

              <div className="flex flex-col form-control w-full">
                <label className="label mb-1.5">
                  <span className="label-text text-lg font-medium">
                    Content
                  </span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here..."
                  className="textarea textarea-bordered min-h-[300px] sm:min-h-[400px] w-full text-base leading-relaxed focus:textarea-primary p-4"
                  required
                ></textarea>
              </div>
            </div>

            <div className="card-actions justify-end mt-8">
              <button
                type="button"
                onClick={() => navigate("/dashboard/forum")}
                className="btn btn-ghost btn-lg"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn border-amber-400 btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Publishing...
                  </>
                ) : (
                  "Publish Post"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal element */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 backdrop-blur-xs"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-base-200 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              {modal.type === "success" && (
                <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-success-content"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
              )}
              {modal.type === "pending" && (
                <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-warning-content"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    ></path>
                  </svg>
                </div>
              )}
              {(modal.type === "auth" || modal.type === "error") && (
                <div className="w-8 h-8 rounded-full bg-error flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-error-content"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {modal.type === "auth" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      ></path>
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                </div>
              )}
              <h3 className="font-bold text-lg" id="modal-title">
                {modal.type === "success" && "Success!"}
                {modal.type === "pending" && "Pending Approval"}
                {modal.type === "auth" && "Authentication Required"}
                {modal.type === "error" && "Error"}
              </h3>
            </div>
            <p className="py-4 flex items-center gap-3">
              {modal.type === "moderatorPrompt" && (
                <span className="inline-flex items-center justify-center w-8 h-8 aspect-square rounded-full text-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <circle cx="12" cy="17" r="1" fill="currentColor" />
                  </svg>
                </span>
              )}
              <span className="font-bold">{modal.message}</span>
            </p>
            <div className="flex justify-end gap-2 mt-8">
              {modal.type === "moderatorPrompt" ? (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => handleModeratorDecision("yes")}
                  >
                    Yes
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => handleModeratorDecision("no")}
                  >
                    No
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={closeModal}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
