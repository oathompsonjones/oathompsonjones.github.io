"use client";
import { Button, Typography } from "@mui/material";
import { LogLevel } from "api/logs";
import axios from "axios";
import { useEffect } from "react";

/**
 * Handles errors for the page.
 *
 * @returns {JSX.Element} An error element.
 */
export default function Error({ error, reset }: { error: Error; reset: () => void; }): JSX.Element {
    // Log the error.
    useEffect(() => void axios.post("/api/logs", {
        content: `Gallery ${error.name}: ${error.message}\n${error.stack ?? ""}`,
        level: LogLevel.ERROR
    }), [error]);

    return (
        <>
            <Typography variant="h4">An error occurred, please try again later.</Typography>
            <Button onClick={reset} size="large" variant="contained">Try Again</Button>
        </>
    );
}
