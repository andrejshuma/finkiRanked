import Navbar from "@/Dashboard/components/Navbar";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RankBadge from "../../utils/RankBadge";

const LeaderBoardEx = () => {
  const [landing, setLanding] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      setLanding(true);
    } else if (location.pathname === "/dashboard/leaderboard") {
      setLanding(false);
    }
  }, [location.pathname]);

  const fetchLeaderboard = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }functions/v1/leaderboard?page=${page}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "Failed to fetch leaderboard");
      }

      if (append) {
        setLeaderboard((prev) => [...prev, ...data.leaderboard]);
      } else {
        setLeaderboard(data.leaderboard);
        setCurrentPage(page);
      }

      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(1, false);
  }, []);

  const handleLoadMore = () => {
    if (pagination && pagination.hasNextPage) {
      fetchLeaderboard(pagination.nextPage, true);
    }
  };

  const getPosition = (index) => {
    return index + 1;
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div data-theme="luxury" className="min-h-screen flex bg-base-100">
        {/* {!landing ? <Navbar /> : null} */}
        <div className="flex w-full flex-col justify-center items-center p-20 gap-10">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (error && leaderboard.length === 0) {
    return (
      <div data-theme="luxury" className="min-h-screen flex bg-base-100">
        {/* {!landing ? <Navbar /> : null} */}
        <div className="flex w-full flex-col justify-center items-center p-20 gap-10">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
          <button
            className="btn btn-tertiary"
            onClick={() => fetchLeaderboard(1, false)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div data-theme="luxury" className="min-h-screen flex bg-base-100">
        {/* {!landing ? <Navbar /> : null} */}

        <div className="flex w-full flex-col items-center p-20 gap-10">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <p>Note: The leaderboard updates every 5 minutes</p>

          {pagination && (
            <div className="flex">
              <div className="stat">
                <div className="stat-title">Total Users</div>

                <div className="text-3xl flex justify-center items-center">
                  {pagination.totalUsers}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Showing</div>

                <div className="text-3xl flex justify-center items-center">
                  {leaderboard.length}
                </div>
              </div>
            </div>
          )}

          <div className="w-full max-w-4xl">
            <div className="rounded-box border border-base-content/5 bg-base-100">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Rank Tier</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, index) => (
                    <tr key={user.id} className="hover">
                      <th>{getPosition(index)}</th>
                      <td className="font-medium">{user.username}</td>
                      <td>
                        <div>
                          <RankBadge rankName={user.rank} />
                        </div>
                      </td>
                      <td className="font-mono font-bold">{user.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && leaderboard.length > 0 && (
            <div className="alert alert-warning">
              <span>Error loading more data: {error}</span>
            </div>
          )}

          {pagination && pagination.hasNextPage && (
            <button
              className={`btn btn-lg ${
                loadingMore ? "btn-disabled" : "btn-primary"
              }`}
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          )}

          {pagination && !pagination.hasNextPage && leaderboard.length > 0 && (
            <div className="text-center text-base-content/70">
              <p>You've reached the end of the leaderboard!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LeaderBoardEx;
