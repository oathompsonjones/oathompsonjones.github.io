"use client";

import { GitHubRepo } from "components/pages/portfolio/githubRepo";
import { Masonry } from "@mui/lab";
import type { ReactElement } from "react";
import type { Repo } from "api/github/route";
import { useFetch } from "hooks/useFetch";

/**
 * This page acts as an online portfolio.
 * @returns My portfolio, accessed from my GitHub profile.
 */
export default function Portfolio(): ReactElement {
    // Calls the backend API to access the repositories from GitHub.
    const repos = useFetch<Repo[]>("/api/github");

    // Renders the portfolio page.
    return (
        <Masonry columns={{ lg: 4, md: 3, sm: 2, xl: 5, xs: 1 }}>
            {(repos ?? []).map((repo, i) => <GitHubRepo key={i} repo={repo} />)}
        </Masonry>
    );
}
