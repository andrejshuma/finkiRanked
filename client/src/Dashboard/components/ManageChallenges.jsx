import React, { useEffect, useRef, useState } from "react";
import {
  getAllTasks,
  deleteTask,
  searchTaskByDate,
} from "@/services/taskService";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

import "cally";
const PAGE_SIZE = 10;

const ManageChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const calendarRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    type: "",
    challengeId: null,
  });
  useEffect(() => {
    const fetchChallengesAndStyleCalendar = async () => {
      setLoading(true);
      const dateParam = searchParams.get("date");

      try {
        if (dateParam) {
          const data = await searchTaskByDate(dateParam);
          setChallenges(data);
          setTotalPages(1);
          setCurrentPage(1);

          if (calendarRef.current) {
            calendarRef.current.value = dateParam;

            calendarRef.current.style.setProperty(
              "--cally-selected-background",
              "white"
            );
            calendarRef.current.style.setProperty(
              "--cally-selected-color",
              "#1f2937"
            );

            calendarRef.current.style.setProperty(
              "--cally-today-background",
              "transparent"
            );
            calendarRef.current.style.setProperty(
              "--cally-today-color",
              "inherit"
            );
          }
        } else {
          const data = await getAllTasks(currentPage, PAGE_SIZE);
          setChallenges(data.challenges);
          setTotalPages(data.totalPages);

          if (calendarRef.current) {
            calendarRef.current.style.removeProperty(
              "--cally-selected-background"
            );
            calendarRef.current.style.removeProperty("--cally-selected-color");
            calendarRef.current.style.removeProperty(
              "--cally-today-background"
            );
            calendarRef.current.style.removeProperty("--cally-today-color");
          }
        }
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengesAndStyleCalendar();
  }, [currentPage, searchParams]);
  const fetchTestCases = async (challengeId) => {
    try {
      setExpandedChallenge(
        expandedChallenge === challengeId ? null : challengeId
      );
    } catch (err) {
      console.error(
        `Failed to fetch test cases for challenge ${challengeId}:`,
        err
      );
    }
  };
  const handleViewAll = async () => {
    setLoading(true);
    try {
      const data = await getAllTasks(1, PAGE_SIZE);
      setChallenges(data.challenges);
      setTotalPages(data.totalPages);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch all challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteChallenge = async (challengeId) => {
    try {
      setLoading(true);
      console.log(challengeId);
      await deleteTask(challengeId);
      setChallenges(
        challenges.filter((challenge) => challenge.id !== challengeId)
      );
      showModal("Challenge deleted successfully.", "success");
    } catch (err) {
      showModal(`Failed to delete challenge: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (message, type = "info", challengeId = null) => {
    setModal({ isOpen: true, message, type, challengeId });
  };

  const closeModal = () => {
    setModal({ isOpen: false, message: "", type: "", challengeId: null });
  };

  const confirmDelete = async () => {
    if (modal.challengeId) {
      setLoading(true);
      await deleteChallenge(modal.challengeId);
      setLoading(false);
    }
  };

  const searchByDate = (date) => {
    if (date) {
      setSearchParams({ date });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold ml-8 mb-12">Manage Challenges</h1>
      <div className="flex flex-col md:flex-row gap-8 ml-8 mx-auto">
        {/* Left sidebar with calendar */}
        <div className="w-full md:w-[310px] flex-shrink-0 ">
          <div className="sticky top-6">
            <div className="card bg-base-200 shadow-md p-4">
              <h2 className="font-semibold text-lg mb-4">Search by date:</h2>

              {/* Calendar component */}
              <calendar-date
                ref={calendarRef}
                class="cally bg-base-100 border border-base-300 shadow-md rounded-box w-full mb-4"
              >
                <svg
                  aria-label="Previous"
                  className="fill-current size-4"
                  slot="previous"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  ></path>
                </svg>
                <svg
                  aria-label="Next"
                  className="fill-current size-4"
                  slot="next"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  ></path>
                </svg>
                <calendar-month></calendar-month>
              </calendar-date>

              {/* Search button */}
              <button
                className="btn btn-block border-amber-400"
                onClick={() => {
                  if (calendarRef.current) {
                    const selectedDate = calendarRef.current.value;
                    searchByDate(selectedDate);
                  }

                  const calendarElement =
                    document.querySelector("calendar-date");
                  if (calendarElement) {
                    const selectedDate = calendarElement.value;
                    searchByDate(selectedDate);
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </button>
            </div>
            <div className="mt-6 w-full">
              {/* Add new challenge button */}
              <button
                className="btn btn-block btn-outline  border-amber-400 gap-2"
                onClick={() => navigate("/dashboard/create-new-challenge")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add New Challenge
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : challenges.length > 0 ? (
            <div className="space-y-6">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="card bg-base-200 shadow-md">
                  <div className="card-body">
                    <div className="flex justify-between items-center">
                      <h2 className="card-title text-xl font-bold">
                        {challenge.title
                          .split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </h2>
                      <div className="badge badge-tertiary p-4">
                        {new Date(challenge.solving_date).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="text-base-content/80 mt-2 line-clamp-2">
                      {challenge.content}
                    </p>

                    {challenge.examples && challenge.examples.length > 0 && (
                      <div className="mt-4 card bg-base-300 p-3">
                        <h3 className="font-medium mb-2">Examples:</h3>
                        <div className="space-y-3">
                          {challenge.examples.map((example, index) => (
                            <div key={index} className="font-mono text-sm">
                              <p className="pl-2 border-l-2 border-amber-400 mt-1">
                                Input: "{example.input || "N/A"}" <br />
                                Output: "{example.output || "N/A"}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="card-actions justify-between mt-4">
                      <button
                        className="btn btn-sm btn-teritary"
                        onClick={() => fetchTestCases(challenge.id)}
                      >
                        {expandedChallenge === challenge.id
                          ? "Hide Test Cases"
                          : "Show Test Cases"}
                      </button>

                      <button
                        className="btn btn-sm btn-error btn-outline"
                        onClick={() =>
                          showModal(
                            `Are you sure you want to delete challenge with title "${challenge.title}" ? This action cannot be undone.`,
                            "confirm",
                            challenge.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>

                    {expandedChallenge === challenge.id &&
                      challenge.test_cases && (
                        <div className="mt-4 card bg-base-300 p-4 ">
                          <h3 className="font-medium mb-2">Test Cases:</h3>
                          <div className="space-y-4 max-h-60 overflow-y-auto">
                            {challenge.test_cases.map((testCase, index) => (
                              <div
                                key={testCase.id}
                                className="card bg-base-100 max-w-250 p-3"
                              >
                                <h4 className="font-medium">
                                  Test Case {index + 1}
                                </h4>
                                <div className="font-mono text-sm">
                                  <div className="pl-2 border-l-2 border-amber-400 mt-1">
                                    <p>Input:</p>
                                    <div className="max-h-40 overflow-y-auto">
                                      <pre className="bg-base-300 p-2 rounded whitespace-pre-wrap break-words w-full overflow-hidden">
                                        {testCase.input || "N/A"}
                                      </pre>
                                    </div>
                                  </div>
                                  <div className="pl-2 border-l-2 border-green-400 mt-2">
                                    <p>Expected Output:</p>
                                    <div className="max-h-40 overflow-y-auto">
                                      <pre className="bg-base-300 p-2 rounded whitespace-pre-wrap break-words w-full overflow-hidden">
                                        {testCase.output || "N/A"}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
              <button
                className="block mx-auto  cursor-pointer hover:underline"
                onClick={() => handleViewAll()}
              >
                View all challenges
              </button>
            </div>
          ) : (
            <div className="text-center text-base-content/60 py-16">
              <p>No available challenges for the selected date.</p>
            </div>
          )}
          {!loading && challenges.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx + 1}
                  className={`btn btn-sm ${
                    currentPage === idx + 1 ? "border-amber-400" : "btn-ghost"
                  }`}
                  onClick={() => setCurrentPage(idx + 1)}
                  disabled={loading}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal (unchanged) */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-base-200 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              {modal.type === "confirm" && (
                <div className="w-8 h-8 rounded-full bg-error flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-error-content"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </div>
              )}
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
              <h3 className="font-bold text-lg" id="modal-title">
                Delete Challenge
              </h3>
            </div>
            <p className="py-4">{modal.message}</p>
            <div className="flex justify-end gap-3 mt-4">
              {modal.type === "confirm" ? (
                <>
                  <button
                    className="btn btn-ghost"
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={confirmDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm mr-2"></span>
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
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

export default ManageChallenges;
