import { serve } from "https://deno.land/std/http/server.ts";
import supabase from "../../../supabaseEdgeClient.js";

const CACHE_DURATION = 5 * 60 * 1000;
const PAGE_SIZE = 20;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(
      url.searchParams.get("limit") || PAGE_SIZE.toString()
    );

    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({
          error: "Invalid parameters",
          message: "Page must be >= 1 and limit must be between 1 and 100",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const now = Date.now();
    const cacheKey = `leaderboard:${page}-${limit}`;

    const { data: cacheData, error: cacheError } = await supabase
      .from("leaderboard_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .single();

    if (cacheData && now - cacheData.timestamp < CACHE_DURATION) {
      return new Response(JSON.stringify({ ...cacheData.data, cached: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "max-age=300",
        },
      });
    }

    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from("users")
      .select("id, username, points, rank", { count: "exact" })
      .order("points", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Supabase query error: ${error.message}`);

    const totalPages = Math.ceil((count ?? 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const responseData = {
      leaderboard: data,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: count,
        usersPerPage: limit,
        hasNextPage,
        hasPreviousPage,
        nextPage: hasNextPage ? page + 1 : null,
        previousPage: hasPreviousPage ? page - 1 : null,
      },
      timestamp: now,
      cached: false,
    };

    await supabase.from("leaderboard_cache").upsert({
      cache_key: cacheKey,
      data: responseData,
      timestamp: now,
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "max-age=300",
      },
    });
  } catch (err: any) {
    console.error("Leaderboard error:", err.message);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch leaderboard",
        message: err.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
